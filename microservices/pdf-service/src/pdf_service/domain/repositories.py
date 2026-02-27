from typing import Protocol
from sqlalchemy import select, delete, insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pdf_service.domain.models import (
    UniversityCurriculum, Catalog, CareerCurriculum
)
from pdf_service.domain.orm_models import (
    YearORM, CatalogCareerORM, CareerCurriculumORM, CycleORM, CourseSectionORM
)
from pdf_service.domain.mappers import (
    university_curriculum_from_orm,
    university_curriculum_to_orm,
    catalog_from_orm,
    catalog_to_orm,
    career_curriculum_to_orm,
    career_curriculum_from_orm
)

# interfaces for the repositories

class UniversityCurriculumRepository(Protocol):
    async def save(self, university_curriculum: UniversityCurriculum) -> None: ...
    async def get_by_school(self, school: str) -> UniversityCurriculum | None: ...
    async def get_by_school_and_year(self, school: str, year: str) -> UniversityCurriculum | None: ...
    async def list_years_for_school(self, school: str) -> list[str]: ...

# static method, well it's a function now
def _year_tree_stmt():
    # this loads everything, yeah, everything
    return (
        select(YearORM)
        .options(
            selectinload(YearORM.career_curriculums)
            .selectinload(CareerCurriculumORM.cycles)
            .selectinload(CycleORM.course_sections)
            .selectinload(CourseSectionORM.schedules)
        )
    )


class SqlUniversityCurriculumRepository(UniversityCurriculumRepository):
    # esta es la clase que hace el trabajo de guardar en la base de datos

    def __init__(self, session: AsyncSession) -> None:
        self.session = session  # agarra la async session de la db

    async def save(self, university_curriculum: UniversityCurriculum) -> None:
        # para añadir un university curriculum se le sacan los year y estos se guardan
        year_entities = university_curriculum_to_orm(university_curriculum)
        self.session.add_all(year_entities)

    async def get_by_school(self, school: str) -> UniversityCurriculum | None:
        # este metodo es distinto al repo de career curriculum:
        # devuelve el agregado completo UniversityCurriculum (years -> careers -> cycles -> sections -> schedules)
        stmt = (
            # can return many career curriculums and not only one
            _year_tree_stmt()
            .join(YearORM.career_curriculums)
            .where(CareerCurriculumORM.school == school)
            .order_by(YearORM.year.desc())
        )
        rows = (await self.session.scalars(stmt)).unique().all()
        if not rows:
            return None
        return university_curriculum_from_orm(rows)

    async def get_by_school_and_year(self, school: str, year: str) -> UniversityCurriculum | None:
        # en el futuro pienso hacer mas interactivo el sidebar del frontend
        # por ahora se requiere de la escuela y el plan de estudios para obtener un university curriculum
        # esta es la query de SQL a ejecutar
        stmt = (
            _year_tree_stmt()
            .join(YearORM.career_curriculums)
            .where(YearORM.year == year)  # filtra que el año sea el correcto
            .where(CareerCurriculumORM.school == school)  # y que la escuela coincida
            .order_by(YearORM.year.desc())
        )
        # se obtienen las filas del agregado YearORM y se mapean al dominio
        rows = (await self.session.scalars(stmt)).unique().all()
        if not rows:
            return None
        return university_curriculum_from_orm(rows)

    async def list_years_for_school(self, school: str) -> list[str]:
        stmt = (
            select(YearORM.year)
            .join(YearORM.career_curriculums)
            .where(CareerCurriculumORM.school == school)
            .distinct()
            .order_by(YearORM.year.desc())
        )
        return list((await self.session.scalars(stmt)).all())

class CatalogRepository(Protocol):
    async def replace_all(self, catalog: Catalog) -> None: ...
    async def get(self) -> Catalog: ...


class SqlCatalogRepository(CatalogRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def replace_all(self, catalog: Catalog) -> None:
        # TODO: redo the delete, think about what to delete
        # await self.session.execute("DELETE FROM catalog_careers")
        await self.session.execute(delete(CatalogCareerORM))  # do the catalog again
        self.session.add_all(catalog_to_orm(catalog))

    async def get(self) -> Catalog:
        stmt = (
            select(CatalogCareerORM)
            .options(
                selectinload(CatalogCareerORM.study_plans),
                selectinload(CatalogCareerORM.cycles)
            )
        )
        rows = (await self.session.scalars(stmt)).unique().all()
        return catalog_from_orm(rows)


class CareerCurriculumRepository(Protocol):
    async def save(self, career_curriculum: CareerCurriculum) -> None: ...
    async def get_by_id(self, career_id: str) -> CareerCurriculum | None: ...
    async def get_by_school(self, school: str) -> CareerCurriculum | None: ...

class SqlCareerCurriculumRepository(CareerCurriculumRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save(self, career_curriculum: CareerCurriculum) -> None:
        m = career_curriculum.metadata
        # remove the previous one, this kinda works like an update
        stmt = (
            select(CareerCurriculumORM)
            .where(CareerCurriculumORM.study_plan == m.studyPlan)
            .where(CareerCurriculumORM.school == m.school)
        )
        # AI generated snipper, this should't happen, metadata always has academicPeriod
        # if getattr(m, "academicPeriod", None):
        #     stmt = stmt.where(CareerCurriculumORM.academic_period == m.academicPeriod)

        old = (await self.session.execute(stmt)).scalar_one_or_none()
        if old:
            await self.session.delete(old)  # if there was a career curriculum before, replace it

        orm_obj = career_curriculum_to_orm(career_curriculum)
        self.session.add(orm_obj)

    async def get_by_id(self, career_id: str) -> CareerCurriculum | None:
        # simple statement
        stmt = (
            select(CareerCurriculumORM)
            .where(CareerCurriculumORM.id == career_id)
        )
        # await the db to respond
        rows = (await self.session.scalars(stmt)).unique().one_or_none()
        if not rows:
            return None
        return career_curriculum_from_orm(rows)

    async def get_by_school(self, school: str) -> CareerCurriculum | None:
        stmt = (
            select(CareerCurriculumORM)
            .where(CareerCurriculumORM.school == school)
        )
        rows = (await self.session.scalars(stmt)).unique().one_or_none()
        if not rows:
            return None
        return career_curriculum_from_orm(rows)
