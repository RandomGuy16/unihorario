"""Mapping helpers between Pydantic domain models and SQLAlchemy ORM models."""

from __future__ import annotations

from pdf_service.domain.models import (
    CareerCurriculum,
    CareerCurriculumMetadata,
    Catalog,
    CatalogCareerData,
    CourseSection,
    Cycle,
    Schedule,
    UniversityCurriculum,
    Year,
)
from pdf_service.domain.orm_models import (
    CatalogCareerORM,
    CatalogCycleORM,
    CatalogStudyPlanORM,
    CareerCurriculumORM,
    CourseSectionORM,
    CycleORM,
    ScheduleORM,
    YearORM,
)


def university_curriculum_to_orm(curriculum: UniversityCurriculum) -> list[YearORM]:
    """Map a domain curriculum tree into ORM entities.

    :param curriculum: Domain curriculum model.
    :type curriculum: UniversityCurriculum
    :return: ORM year entities with nested child relations populated.
    :rtype: list[YearORM]
    """
    year_entities: list[YearORM] = []

    for year in curriculum.years:
        year_orm = YearORM(year=year.year)
        year_orm.career_curriculums = [career_curriculum_to_orm(c) for c in year.careerCurriculums]
        year_entities.append(year_orm)

    return year_entities


def career_curriculum_to_orm(career: CareerCurriculum) -> CareerCurriculumORM:
    """Map domain career curriculum to ORM entity.

    :param career: Domain career curriculum.
    :type career: CareerCurriculum
    :return: ORM entity with nested cycles.
    :rtype: CareerCurriculumORM
    """
    metadata = career.metadata
    career_orm = CareerCurriculumORM(
        faculty=metadata.faculty,
        school=metadata.school,
        specialization=metadata.specialization,
        study_plan=metadata.studyPlan,
        academic_period=metadata.academicPeriod,
        date_printed=metadata.datePrinted,
    )
    career_orm.cycles = [cycle_to_orm(c) for c in career.cycles]
    return career_orm


def cycle_to_orm(cycle: Cycle) -> CycleORM:
    """Map domain cycle to ORM entity.

    :param cycle: Domain cycle model.
    :type cycle: Cycle
    :return: ORM cycle with nested sections.
    :rtype: CycleORM
    """
    cycle_orm = CycleORM(name=cycle.cycle)
    cycle_orm.course_sections = [course_section_to_orm(section) for section in cycle.courseSections]
    return cycle_orm


def course_section_to_orm(section: CourseSection) -> CourseSectionORM:
    """Map domain course section to ORM entity.

    :param section: Domain course section model.
    :type section: CourseSection
    :return: ORM course section with nested schedules.
    :rtype: CourseSectionORM
    """
    section_orm = CourseSectionORM(
        assignment=section.assignment,
        assignment_id=section.assignmentId,
        section_number=section.sectionNumber,
        teacher=section.teacher,
        credits=section.credits,
        study_plan=section.studyPlan,
        max_students=section.maxStudents,
        course_visible=section.courseVisible,
    )
    section_orm.schedules = [schedule_to_orm(s) for s in section.schedules]
    return section_orm


def schedule_to_orm(schedule: Schedule) -> ScheduleORM:
    """Map domain schedule slot to ORM entity.

    :param schedule: Domain schedule model.
    :type schedule: Schedule
    :return: ORM schedule entity.
    :rtype: ScheduleORM
    """
    return ScheduleORM(
        day=schedule.day,
        start_time=schedule.start,
        end_time=schedule.end,
        session_type=schedule.type,
        schedule_number=schedule.scheduleNumber,
        section_number=schedule.sectionNumber,
        teacher=schedule.teacher,
    )


def university_curriculum_from_orm(year_entities: list[YearORM]) -> UniversityCurriculum:
    """Map ORM year entities to a domain curriculum tree.

    :param year_entities: ORM years with nested relations loaded.
    :type year_entities: list[YearORM]
    :return: Domain curriculum tree.
    :rtype: UniversityCurriculum
    """
    years = [year_from_orm(y) for y in year_entities]
    return UniversityCurriculum(years=years)


def year_from_orm(year_orm: YearORM) -> Year:
    """Map ORM year to domain model.

    :param year_orm: ORM year entity.
    :type year_orm: YearORM
    :return: Domain year model.
    :rtype: Year
    """
    return Year(
        year=year_orm.year,
        careerCurriculums=[career_curriculum_from_orm(c) for c in year_orm.career_curriculums],
    )


def career_curriculum_from_orm(career_orm: CareerCurriculumORM) -> CareerCurriculum:
    """Map ORM career curriculum to domain model.

    :param career_orm: ORM career curriculum entity.
    :type career_orm: CareerCurriculumORM
    :return: Domain career curriculum.
    :rtype: CareerCurriculum
    """
    return CareerCurriculum(
        metadata=CareerCurriculumMetadata(
            faculty=career_orm.faculty,
            school=career_orm.school,
            specialization=career_orm.specialization,
            studyPlan=career_orm.study_plan,
            academicPeriod=career_orm.academic_period,
            datePrinted=career_orm.date_printed,
        ),
        cycles=[cycle_from_orm(c) for c in career_orm.cycles],
    )


def cycle_from_orm(cycle_orm: CycleORM) -> Cycle:
    """Map ORM cycle to domain model.

    :param cycle_orm: ORM cycle entity.
    :type cycle_orm: CycleORM
    :return: Domain cycle model.
    :rtype: Cycle
    """
    return Cycle(
        cycle=cycle_orm.name,
        courseSections=[course_section_from_orm(s) for s in cycle_orm.course_sections],
    )


def course_section_from_orm(section_orm: CourseSectionORM) -> CourseSection:
    """Map ORM course section to domain model.

    :param section_orm: ORM course section entity.
    :type section_orm: CourseSectionORM
    :return: Domain course section model.
    :rtype: CourseSection
    """
    schedules = [schedule_from_orm(section_orm, s) for s in section_orm.schedules]

    return CourseSection(
        assignment=section_orm.assignment,
        assignmentId=section_orm.assignment_id,
        sectionNumber=section_orm.section_number,
        teacher=section_orm.teacher,
        schedules=schedules,
        credits=section_orm.credits,
        studyPlan=section_orm.study_plan,
        maxStudents=section_orm.max_students,
        courseVisible=section_orm.course_visible,
    )


def schedule_from_orm(section_orm: CourseSectionORM, schedule_orm: ScheduleORM) -> Schedule:
    """Map ORM schedule to domain model.

    :param section_orm: Parent ORM section entity.
    :type section_orm: CourseSectionORM
    :param schedule_orm: ORM schedule entity.
    :type schedule_orm: ScheduleORM
    :return: Domain schedule model.
    :rtype: Schedule
    """
    return Schedule(
        assignment=section_orm.assignment,
        assignmentId=section_orm.assignment_id,
        day=schedule_orm.day,
        start=schedule_orm.start_time,
        end=schedule_orm.end_time,
        type=schedule_orm.session_type,
        scheduleNumber=schedule_orm.schedule_number,
        sectionNumber=schedule_orm.section_number,
        teacher=schedule_orm.teacher,
    )


def catalog_career_data_to_orm(career_data: CatalogCareerData, career_key: str) -> CatalogCareerORM:
    """Map domain career data to ORM entity."""
    orm_obj = CatalogCareerORM(
        career_key=career_key,
        faculty=career_data.faculty,
        career=career_data.career,
    )
    orm_obj.study_plans = [CatalogStudyPlanORM(study_plan=p) for p in career_data.studyPlans]
    orm_obj.cycles = [CatalogCycleORM(cycle_name=c) for c in career_data.cycles]
    return orm_obj


def catalog_career_data_from_orm(catalog_career: CatalogCareerORM) -> CatalogCareerData:
    """Map one catalog ORM entity into domain-level catalog career data.

    :param catalog_career: ORM catalog career entity with related plans/cycles.
    :type catalog_career: CatalogCareerORM
    :return: Domain catalog career data object.
    :rtype: CatalogCareerData
    """
    return CatalogCareerData(
        career=catalog_career.career,
        faculty=catalog_career.faculty,
        studyPlans=[plan.study_plan for plan in catalog_career.study_plans],
        cycles=[cycle.cycle_name for cycle in catalog_career.cycles]
    )


def catalog_to_orm(catalog: Catalog) -> list[CatalogCareerORM]:
    """Map domain catalog to ORM entities.

    :param catalog: Domain catalog model.
    :type catalog: Catalog
    :return: ORM catalog career entities with nested plans and cycles.
    :rtype: list[CatalogCareerORM]
    """
    entries: list[CatalogCareerORM] = []
    for career_key, career_data in catalog.careers.items():
        entry = catalog_career_data_to_orm(career_data, career_key)
        entries.append(entry)
    return entries


def catalog_from_orm(career_entities: list[CatalogCareerORM]) -> Catalog:
    """Map ORM catalog entities to a domain catalog.

    :param career_entities: ORM catalog career entities.
    :type career_entities: list[CatalogCareerORM]
    :return: Domain catalog model.
    :rtype: Catalog
    """
    careers: dict[str, CatalogCareerData] = {}
    for entity in career_entities:
        careers[entity.career_key] = CatalogCareerData(
            studyPlans=[p.study_plan for p in entity.study_plans],
            cycles=[c.cycle_name for c in entity.cycles],
            faculty=entity.faculty,
            career=entity.career,
        )
    return Catalog(careers=careers)
