from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
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
    __tablename__ = "years"

    id:   Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    year: Mapped[str] = mapped_column(String(16), nullable=False, index=True)

    career_curriculums: Mapped[list[CareerCurriculumORM]] = relationship(
        back_populates="year",
        cascade="all, delete-orphan",
    )


class CareerCurriculumORM(Base, TimestampMixin):
    __tablename__  = "career_curriculums"
    __table_args__ = (
        Index("ix_career_curriculums_lookup", "school", "study_plan", "academic_period"),
    )

    id:      Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    year_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("years.id", ondelete="CASCADE"),
        nullable=False,
    )

    faculty:         Mapped[str] = mapped_column(String(128), nullable=False)
    school:          Mapped[str] = mapped_column(String(128), nullable=False)
    specialization:  Mapped[str] = mapped_column(String(128), nullable=False)
    study_plan:      Mapped[str] = mapped_column(String(32), nullable=False)
    academic_period: Mapped[str] = mapped_column(String(32), nullable=False)
    date_printed:    Mapped[str] = mapped_column(String(32), nullable=False)

    year:   Mapped[YearORM] = relationship(back_populates="career_curriculums")
    cycles: Mapped[list[CycleORM]] = relationship(
        back_populates="career_curriculum",
        cascade="all, delete-orphan",
    )


class CycleORM(Base, TimestampMixin):
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

    assignment:     Mapped[str]  = mapped_column(String(256), nullable=False)
    assignment_id:  Mapped[str]  = mapped_column(String(32), nullable=False)
    section_number: Mapped[int]  = mapped_column(Integer, nullable=False)
    teacher:        Mapped[str]  = mapped_column(String(128), nullable=False)
    credits:        Mapped[int]  = mapped_column(Integer, nullable=False)
    study_plan:     Mapped[str]  = mapped_column(String(32), nullable=False)
    max_students:   Mapped[int]  = mapped_column(Integer, nullable=False)
    course_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    cycle: Mapped[CycleORM] = relationship(back_populates="course_sections")
    schedules: Mapped[list[ScheduleORM]] = relationship(
        back_populates="course_section",
        cascade="all, delete-orphan",
    )


class ScheduleORM(Base, TimestampMixin):
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

    day:             Mapped[str] = mapped_column(String(16), nullable=False)
    start_time:      Mapped[str] = mapped_column(String(8), nullable=False)
    end_time:        Mapped[str] = mapped_column(String(8), nullable=False)
    session_type:    Mapped[str] = mapped_column(String(32), nullable=False)
    schedule_number: Mapped[int] = mapped_column(Integer, nullable=False)
    section_number:  Mapped[int] = mapped_column(Integer, nullable=False)
    teacher:         Mapped[str] = mapped_column(String(128), nullable=False)

    course_section: Mapped[CourseSectionORM] = relationship(back_populates="schedules")


class CatalogCareerORM(Base, TimestampMixin):
    __tablename__ = "catalog_careers"

    id:         Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    career_key: Mapped[str]  = mapped_column(String(128), nullable=False, unique=True, index=True)
    faculty:    Mapped[str]  = mapped_column(String(128), nullable=False)
    career:     Mapped[str]  = mapped_column(String(128), nullable=False)

    study_plans: Mapped[list[CatalogStudyPlanORM]] = relationship(
        back_populates="career",
        cascade="all, delete-orphan",
    )
    cycles: Mapped[list[CatalogCycleORM]] = relationship(
        back_populates="career",
        cascade="all, delete-orphan",
    )


class CatalogStudyPlanORM(Base, TimestampMixin):
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

