from pdf_service.domain.mappers import (
    catalog_from_orm,
    catalog_to_orm,
    university_curriculum_from_orm,
    university_curriculum_to_orm,
)
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


def _build_sample_curriculum() -> UniversityCurriculum:
    return UniversityCurriculum(
        years=[
            Year(
                year="2021",
                careerCurriculums=[
                    CareerCurriculum(
                        metadata=CareerCurriculumMetadata(
                            faculty="Engineering",
                            school="Computer Science",
                            specialization="Software",
                            studyPlan="2021",
                            academicPeriod="2026-1",
                            datePrinted="2026-02-25",
                        ),
                        cycles=[
                            Cycle(
                                cycle="CICLO 1",
                                courseSections=[
                                    CourseSection(
                                        assignment="Calculus I",
                                        assignmentId="MAT101",
                                        sectionNumber=1,
                                        teacher="Prof. Euler",
                                        credits=4,
                                        studyPlan="2021",
                                        maxStudents=40,
                                        courseVisible=True,
                                        schedules=[
                                            Schedule(
                                                assignment="Calculus I",
                                                assignmentId="MAT101",
                                                day="LUN",
                                                start="08:00",
                                                end="10:00",
                                                type="Teoria",
                                                scheduleNumber=1,
                                                sectionNumber=1,
                                                teacher="Prof. Euler",
                                            ),
                                            Schedule(
                                                assignment="Calculus I",
                                                assignmentId="MAT101",
                                                day="MIE",
                                                start="08:00",
                                                end="10:00",
                                                type="Practica",
                                                scheduleNumber=2,
                                                sectionNumber=1,
                                                teacher="Prof. Euler",
                                            ),
                                        ],
                                    )
                                ],
                            )
                        ],
                    )
                ],
            )
        ]
    )


def test_university_curriculum_to_orm_maps_nested_fields():
    curriculum = _build_sample_curriculum()

    years_orm = university_curriculum_to_orm(curriculum)

    assert len(years_orm) == 1
    year_orm = years_orm[0]
    assert year_orm.year == "2021"
    assert len(year_orm.career_curriculums) == 1

    career_orm = year_orm.career_curriculums[0]
    assert career_orm.school == "Computer Science"
    assert career_orm.study_plan == "2021"
    assert len(career_orm.cycles) == 1

    cycle_orm = career_orm.cycles[0]
    assert cycle_orm.name == "CICLO 1"
    assert len(cycle_orm.course_sections) == 1

    section_orm = cycle_orm.course_sections[0]
    assert section_orm.assignment_id == "MAT101"
    assert section_orm.section_number == 1
    assert len(section_orm.schedules) == 2

    schedule_orm = section_orm.schedules[0]
    assert schedule_orm.start_time == "08:00"
    assert schedule_orm.session_type == "Teoria"


def test_university_curriculum_roundtrip_domain_to_orm_to_domain():
    curriculum = _build_sample_curriculum()

    years_orm = university_curriculum_to_orm(curriculum)
    mapped_back = university_curriculum_from_orm(years_orm)

    assert mapped_back.model_dump() == curriculum.model_dump()


def test_catalog_roundtrip_domain_to_orm_to_domain():
    catalog = Catalog(
        careers={
            "systems-engineering": CatalogCareerData(
                studyPlans=["2018", "2021"],
                cycles=["CICLO 1", "CICLO 2"],
                faculty="Engineering",
                career="Systems Engineering",
            )
        }
    )

    orm_entries = catalog_to_orm(catalog)
    mapped_back = catalog_from_orm(orm_entries)

    assert mapped_back.model_dump() == catalog.model_dump()
