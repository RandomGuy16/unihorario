import os

import pytest
import pytest_asyncio
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

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
from pdf_service.domain.repositories import SqlCatalogRepository, SqlUniversityCurriculumRepository


TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/unihorario_test",
)


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
