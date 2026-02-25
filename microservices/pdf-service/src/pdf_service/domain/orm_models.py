from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM entities in the PDF service."""


class TimestampMixin:
    """Mixin that provides audit timestamps for ORM entities.

    :ivar created_at: UTC timestamp set when the row is created.
    :vartype created_at: datetime
    :ivar updated_at: UTC timestamp set on update by ORM-managed writes.
    :vartype updated_at: datetime
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class YearORM(Base, TimestampMixin):
    """Represents an academic year that groups career curriculums.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar year: Year label from source data.
    :vartype year: str
    :ivar career_curriculums: Child curriculums for this year.
    :vartype career_curriculums: list[CareerCurriculumORM]
    """

    __tablename__ = "years"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    year: Mapped[str] = mapped_column(String(16), nullable=False, index=True)

    # relationship tells sqlalchemy that this has many CareerCurriculumORM
    # and that when this gets deleted, delete its children that are now orphaned
    career_curriculums: Mapped[list[CareerCurriculumORM]] = relationship(
        back_populates="year",
        cascade="all, delete-orphan",
    )


class CareerCurriculumORM(Base, TimestampMixin):
    """Represents parsed curriculum metadata and its cycle tree.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar year_id: Foreign key to ``years.id``.
    :vartype year_id: uuid.UUID
    :ivar faculty: Faculty name.
    :vartype faculty: str
    :ivar school: School or career identifier.
    :vartype school: str
    :ivar specialization: Specialization label.
    :vartype specialization: str
    :ivar study_plan: Study plan identifier.
    :vartype study_plan: str
    :ivar academic_period: Academic period value.
    :vartype academic_period: str
    :ivar date_printed: Printed date extracted from source.
    :vartype date_printed: str
    :ivar year: Parent year relation.
    :vartype year: YearORM
    :ivar cycles: Child cycle relations.
    :vartype cycles: list[CycleORM]
    """

    __tablename__ = "career_curriculums"
    # __table_args__ are some special arguments for the database
    __table_args__ = (
        # Index tells the db to index this table with those attributes into account for faster lookups
        # by default is indexed only based on the ID
        Index("ix_career_curriculums_lookup", "school", "study_plan", "academic_period"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    year_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("years.id", ondelete="CASCADE"),
        nullable=False,
    )

    faculty: Mapped[str] = mapped_column(String(128), nullable=False)
    school: Mapped[str] = mapped_column(String(128), nullable=False)
    specialization: Mapped[str] = mapped_column(String(128), nullable=False)
    study_plan: Mapped[str] = mapped_column(String(32), nullable=False)
    academic_period: Mapped[str] = mapped_column(String(32), nullable=False)
    date_printed: Mapped[str] = mapped_column(String(32), nullable=False)

    # link to relationship: Year had field career_curriculums that back populated "year"
    year: Mapped[YearORM] = relationship(back_populates="career_curriculums")  # completes the relationship
    cycles: Mapped[list[CycleORM]] = relationship(
        back_populates="career_curriculum",
        cascade="all, delete-orphan",
    )


class CycleORM(Base, TimestampMixin):
    """Represents one curriculum cycle and its course sections.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar career_curriculum_id: Foreign key to ``career_curriculums.id``.
    :vartype career_curriculum_id: uuid.UUID
    :ivar name: Cycle label.
    :vartype name: str
    :ivar career_curriculum: Parent curriculum relation.
    :vartype career_curriculum: CareerCurriculumORM
    :ivar course_sections: Child section relations.
    :vartype course_sections: list[CourseSectionORM]
    """

    __tablename__ = "cycles"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    career_curriculum_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("career_curriculums.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)

    career_curriculum: Mapped[CareerCurriculumORM] = relationship(back_populates="cycles")
    course_sections: Mapped[list[CourseSectionORM]] = relationship(
        back_populates="cycle",
        cascade="all, delete-orphan",
    )


class CourseSectionORM(Base, TimestampMixin):
    """Represents one course section under a cycle.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar cycle_id: Foreign key to ``cycles.id``.
    :vartype cycle_id: uuid.UUID
    :ivar assignment: Assignment name.
    :vartype assignment: str
    :ivar assignment_id: External assignment identifier.
    :vartype assignment_id: str
    :ivar section_number: Numeric section identifier.
    :vartype section_number: int
    :ivar teacher: Main teacher name.
    :vartype teacher: str
    :ivar credits: Credit amount.
    :vartype credits: int
    :ivar study_plan: Study plan identifier.
    :vartype study_plan: str
    :ivar max_students: Enrollment capacity.
    :vartype max_students: int
    :ivar course_visible: Visibility flag from source.
    :vartype course_visible: bool
    :ivar cycle: Parent cycle relation.
    :vartype cycle: CycleORM
    :ivar schedules: Child schedule relations.
    :vartype schedules: list[ScheduleORM]
    """

    __tablename__ = "course_sections"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "section_number",
            "cycle_id",
            name="uq_course_sections_assignment_section_cycle",
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    cycle_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cycles.id", ondelete="CASCADE"),
        nullable=False,
    )

    assignment: Mapped[str] = mapped_column(String(256), nullable=False)
    assignment_id: Mapped[str] = mapped_column(String(32), nullable=False)
    section_number: Mapped[int] = mapped_column(Integer, nullable=False)
    teacher: Mapped[str] = mapped_column(String(128), nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)
    study_plan: Mapped[str] = mapped_column(String(32), nullable=False)
    max_students: Mapped[int] = mapped_column(Integer, nullable=False)
    course_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    cycle: Mapped[CycleORM] = relationship(back_populates="course_sections")
    schedules: Mapped[list[ScheduleORM]] = relationship(
        back_populates="course_section",
        cascade="all, delete-orphan",
    )


class ScheduleORM(Base, TimestampMixin):
    """Represents one schedule slot for a course section.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar course_section_id: Foreign key to ``course_sections.id``.
    :vartype course_section_id: uuid.UUID
    :ivar day: Day label.
    :vartype day: str
    :ivar start_time: Slot start time.
    :vartype start_time: str
    :ivar end_time: Slot end time.
    :vartype end_time: str
    :ivar session_type: Session type label.
    :vartype session_type: str
    :ivar schedule_number: Sequence number for this slot.
    :vartype schedule_number: int
    :ivar section_number: Source section number for traceability.
    :vartype section_number: int
    :ivar teacher: Teacher name for this slot.
    :vartype teacher: str
    :ivar course_section: Parent course section relation.
    :vartype course_section: CourseSectionORM
    """

    __tablename__ = "schedules"
    __table_args__ = (
        UniqueConstraint(
            "course_section_id",
            "schedule_number",
            "day",
            "start_time",
            name="uq_schedules_section_schedule_day_start",
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    course_section_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("course_sections.id", ondelete="CASCADE"),
        nullable=False,
    )

    day: Mapped[str] = mapped_column(String(16), nullable=False)
    start_time: Mapped[str] = mapped_column(String(8), nullable=False)
    end_time: Mapped[str] = mapped_column(String(8), nullable=False)
    session_type: Mapped[str] = mapped_column(String(32), nullable=False)
    schedule_number: Mapped[int] = mapped_column(Integer, nullable=False)
    section_number: Mapped[int] = mapped_column(Integer, nullable=False)
    teacher: Mapped[str] = mapped_column(String(128), nullable=False)

    course_section: Mapped[CourseSectionORM] = relationship(back_populates="schedules")


class CatalogCareerORM(Base, TimestampMixin):
    """Represents one top-level catalog career entry.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar career_key: Unique key used in catalog dictionaries.
    :vartype career_key: str
    :ivar faculty: Faculty label.
    :vartype faculty: str
    :ivar career: Career display name.
    :vartype career: str
    :ivar study_plans: Child study plans.
    :vartype study_plans: list[CatalogStudyPlanORM]
    :ivar cycles: Child cycles.
    :vartype cycles: list[CatalogCycleORM]
    """

    __tablename__ = "catalog_careers"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    career_key: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    faculty: Mapped[str] = mapped_column(String(128), nullable=False)
    career: Mapped[str] = mapped_column(String(128), nullable=False)

    study_plans: Mapped[list[CatalogStudyPlanORM]] = relationship(
        back_populates="career",
        cascade="all, delete-orphan",
    )
    cycles: Mapped[list[CatalogCycleORM]] = relationship(
        back_populates="career",
        cascade="all, delete-orphan",
    )


class CatalogStudyPlanORM(Base, TimestampMixin):
    """Represents one study plan value under a catalog career.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar catalog_career_id: Foreign key to ``catalog_careers.id``.
    :vartype catalog_career_id: uuid.UUID
    :ivar study_plan: Study plan label.
    :vartype study_plan: str
    :ivar career: Parent catalog career relation.
    :vartype career: CatalogCareerORM
    """

    __tablename__ = "catalog_study_plans"
    __table_args__ = (
        UniqueConstraint("catalog_career_id", "study_plan", name="uq_catalog_study_plan"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    catalog_career_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("catalog_careers.id", ondelete="CASCADE"),
        nullable=False,
    )
    study_plan: Mapped[str] = mapped_column(String(64), nullable=False)

    career: Mapped[CatalogCareerORM] = relationship(back_populates="study_plans")


class CatalogCycleORM(Base, TimestampMixin):
    """Represents one cycle value under a catalog career.

    :ivar id: Primary key UUID.
    :vartype id: uuid.UUID
    :ivar catalog_career_id: Foreign key to ``catalog_careers.id``.
    :vartype catalog_career_id: uuid.UUID
    :ivar cycle_name: Cycle label.
    :vartype cycle_name: str
    :ivar career: Parent catalog career relation.
    :vartype career: CatalogCareerORM
    """

    __tablename__ = "catalog_cycles"
    __table_args__ = (
        UniqueConstraint("catalog_career_id", "cycle_name", name="uq_catalog_cycle"),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    catalog_career_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("catalog_careers.id", ondelete="CASCADE"),
        nullable=False,
    )
    cycle_name: Mapped[str] = mapped_column(String(64), nullable=False)

    career: Mapped[CatalogCareerORM] = relationship(back_populates="cycles")
