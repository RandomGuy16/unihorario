import os
from pathlib import Path

import pytest
import pytest_asyncio
from sqlalchemy import delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from pdf_service.core.config import FIXTURES_DIR_PATH
from pdf_service.domain.data_transform import parse_pdf_sync
from pdf_service.domain.models import (
    Catalog,
    CatalogCareerData,
    CareerCurriculum,
    CareerCurriculumMetadata,
    CourseSection,
    Cycle,
    Schedule,
    UniversityCurriculum,
    Year,
)
from pdf_service.domain.orm_models import Base, CatalogCareerORM, CareerCurriculumORM, YearORM
from pdf_service.domain.mappers import career_curriculum_to_orm
from pdf_service.domain.repositories import SqlCatalogRepository, SqlUniversityCurriculumRepository


TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/unihorario_test",
)
FIXTURES_DIR = Path(FIXTURES_DIR_PATH)


def _sample_curriculum() -> UniversityCurriculum:
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
                            datePrinted="2026-02-28",
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
                                            )
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


def _sample_catalog() -> Catalog:
    return Catalog(
        careers={
            "computer-science": CatalogCareerData(
                studyPlans=["2021"],
                cycles=["CICLO 1", "CICLO 2"],
                faculty="Engineering",
                career="Computer Science",
            )
        }
    )


@pytest_asyncio.fixture
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with SessionLocal() as session:
        # Keep integration tests isolated even with committed writes.
        await session.execute(delete(CatalogCareerORM))
        await session.execute(delete(CareerCurriculumORM))
        await session.execute(delete(YearORM))
        await session.commit()
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_sql_university_curriculum_repository_save_and_get_by_school(session):
    expected = _sample_curriculum()
    repo = SqlUniversityCurriculumRepository(session)

    await repo.save(expected)
    await session.commit()
    got = await repo.get_by_school("Computer Science")

    assert got is not None
    assert got.model_dump() == expected.model_dump()


@pytest.mark.asyncio
async def test_sql_university_curriculum_repository_list_years_for_school(session):
    expected = _sample_curriculum()
    repo = SqlUniversityCurriculumRepository(session)

    await repo.save(expected)
    await session.commit()
    years = await repo.list_years_for_school("Computer Science")

    assert years == ["2021"]


@pytest.mark.asyncio
async def test_sql_university_curriculum_repository_save_merges_repeated_years(session):
    repo = SqlUniversityCurriculumRepository(session)
    first = UniversityCurriculum(
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
                            datePrinted="2026-02-28",
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
                                            )
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
    second = UniversityCurriculum(
        years=[
            Year(
                year="2021",
                careerCurriculums=[
                    CareerCurriculum(
                        metadata=CareerCurriculumMetadata(
                            faculty="Engineering",
                            school="Electronics",
                            specialization="Embedded",
                            studyPlan="2021",
                            academicPeriod="2026-1",
                            datePrinted="2026-02-28",
                        ),
                        cycles=[
                            Cycle(
                                cycle="CICLO 1",
                                courseSections=[
                                    CourseSection(
                                        assignment="Physics I",
                                        assignmentId="PHY101",
                                        sectionNumber=1,
                                        teacher="Prof. Tesla",
                                        credits=4,
                                        studyPlan="2021",
                                        maxStudents=35,
                                        courseVisible=True,
                                        schedules=[
                                            Schedule(
                                                assignment="Physics I",
                                                assignmentId="PHY101",
                                                day="MAR",
                                                start="10:00",
                                                end="12:00",
                                                type="Teoria",
                                                scheduleNumber=1,
                                                sectionNumber=1,
                                                teacher="Prof. Tesla",
                                            )
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

    await repo.save(first)
    await session.commit()
    await repo.save(second)
    await session.commit()

    year_count = await session.scalar(select(func.count()).select_from(YearORM))
    stored = await repo.get()

    assert year_count == 1
    assert stored is not None
    assert len(stored.years) == 1
    schools = {
        career.metadata.school
        for career in stored.years[0].careerCurriculums
    }
    assert schools == {"Computer Science", "Electronics"}


@pytest.mark.asyncio
async def test_sql_university_curriculum_repository_save_replaces_existing_career_in_same_year(session):
    repo = SqlUniversityCurriculumRepository(session)
    first = _sample_curriculum()
    updated = UniversityCurriculum(
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
                            academicPeriod="2026-2",
                            datePrinted="2026-03-01",
                        ),
                        cycles=[
                            Cycle(
                                cycle="CICLO 2",
                                courseSections=[
                                    CourseSection(
                                        assignment="Linear Algebra",
                                        assignmentId="MAT201",
                                        sectionNumber=1,
                                        teacher="Prof. Noether",
                                        credits=4,
                                        studyPlan="2021",
                                        maxStudents=45,
                                        courseVisible=True,
                                        schedules=[
                                            Schedule(
                                                assignment="Linear Algebra",
                                                assignmentId="MAT201",
                                                day="MIE",
                                                start="14:00",
                                                end="16:00",
                                                type="Teoria",
                                                scheduleNumber=1,
                                                sectionNumber=1,
                                                teacher="Prof. Noether",
                                            )
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

    await repo.save(first)
    await session.commit()
    await repo.save(updated)
    await session.commit()

    stored = await repo.get_by_school("Computer Science")

    assert stored is not None
    assert len(stored.years) == 1
    careers = stored.years[0].careerCurriculums
    assert len(careers) == 1
    assert careers[0].metadata.academicPeriod == "2026-2"
    assert careers[0].cycles[0].cycle == "CICLO 2"


@pytest.mark.asyncio
async def test_sql_university_curriculum_repository_save_removes_all_stale_duplicate_careers(session):
    repo = SqlUniversityCurriculumRepository(session)
    first = parse_pdf_sync(FIXTURES_DIR / "ingenieria_sistemas.pdf")
    first_year = first.years[0].year
    first_career = first.years[0].careerCurriculums[0]
    first_school = first_career.metadata.school
    first_study_plan = first_career.metadata.studyPlan
    updated = first.model_copy(deep=True)
    updated_career = updated.years[0].careerCurriculums[0]
    updated_career.metadata.academicPeriod = "2099-1"
    updated_career.cycles = updated_career.cycles[:1]

    await repo.save(first)
    await session.commit()

    stored_year = await session.scalar(
        select(YearORM)
        .options(selectinload(YearORM.career_curriculums))
        .where(YearORM.year == first_year)
    )
    assert stored_year is not None
    stored_year.career_curriculums.append(career_curriculum_to_orm(first.years[0].careerCurriculums[0]))
    await session.commit()

    duplicate_count = await session.scalar(
        select(func.count())
        .select_from(CareerCurriculumORM)
        .where(CareerCurriculumORM.school == first_school)
        .where(CareerCurriculumORM.study_plan == first_study_plan)
    )
    assert duplicate_count == 2

    await repo.save(updated)
    await session.commit()

    remaining_count = await session.scalar(
        select(func.count())
        .select_from(CareerCurriculumORM)
        .where(CareerCurriculumORM.school == first_school)
        .where(CareerCurriculumORM.study_plan == first_study_plan)
    )
    stored = await repo.get_by_school(first_school)

    assert remaining_count == 1
    assert stored is not None
    assert len(stored.years) == 1
    careers = stored.years[0].careerCurriculums
    assert len(careers) == 1
    assert careers[0].metadata.school == first_career.metadata.school
    assert careers[0].metadata.studyPlan == first_career.metadata.studyPlan
    assert careers[0].metadata.academicPeriod == "2099-1"
    assert len(careers[0].cycles) == 1


@pytest.mark.asyncio
async def test_sql_catalog_repository_save_and_get(session):
    repo = SqlCatalogRepository(session)
    career = CatalogCareerData(
        studyPlans=["2021", "2022"],
        cycles=["CICLO 1", "CICLO 2"],
        faculty="Engineering",
        career="Computer Science",
    )

    await repo.save(career)
    await session.commit()
    got = await repo.get()

    assert "Computer Science" in got.careers
    stored = got.careers["Computer Science"]
    assert set(stored.studyPlans) == {"2021", "2022"}
    assert set(stored.cycles) == {"CICLO 1", "CICLO 2"}
    assert stored.faculty == "Engineering"
    assert stored.career == "Computer Science"


@pytest.mark.asyncio
async def test_sql_catalog_repository_replace_all(session):
    repo = SqlCatalogRepository(session)
    first = Catalog(
        careers={
            "systems-engineering": CatalogCareerData(
                studyPlans=["2018"],
                cycles=["CICLO 1"],
                faculty="Engineering",
                career="Systems Engineering",
            )
        }
    )
    second = _sample_catalog()

    await repo.replace_all(first)
    await session.commit()
    got_first = await repo.get()
    assert "systems-engineering" in got_first.careers

    await repo.replace_all(second)
    await session.commit()
    got_second = await repo.get()

    assert "systems-engineering" not in got_second.careers
    assert "computer-science" in got_second.careers
    stored = got_second.careers["computer-science"]
    assert stored.career == "Computer Science"


@pytest.mark.asyncio
async def test_sql_catalog_repository_save_is_idempotent_for_same_career_key(session):
    repo = SqlCatalogRepository(session)
    first = CatalogCareerData(
        studyPlans=["2021"],
        cycles=["CICLO 1"],
        faculty="Engineering",
        career="Computer Science",
    )
    second = CatalogCareerData(
        studyPlans=["2021", "2022"],
        cycles=["CICLO 1", "CICLO 2"],
        faculty="Engineering",
        career="Computer Science",
    )

    await repo.save(first)
    await session.commit()

    await repo.save(second)
    await session.commit()

    got = await repo.get()
    assert "Computer Science" in got.careers
    stored = got.careers["Computer Science"]
    assert set(stored.studyPlans) == {"2021", "2022"}
    assert set(stored.cycles) == {"CICLO 1", "CICLO 2"}
