from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from pdf_service.domain.repositories import (
    CatalogRepository,
    CareerCurriculumRepository,
    SqlCatalogRepository,
    SqlCareerCurriculumRepository,
    SqlUniversityCurriculumRepository,
    UniversityCurriculumRepository,
)

# AI generated example
# from contextlib import asynccontextmanager
#
# class UnitOfWork:
#     def __init__(self, session_factory):
#         self.session_factory = session_factory
#
#     @asynccontextmanager
#     async def __call__(self):
#         async with self.session_factory() as session:
#             async with session.begin():
#                 class Repos:
#                     pass
#                 repos = Repos()
#                 repos.curriculums = SqlAlchemyCurriculumRepository(session)
#                 repos.catalogs = SqlAlchemyCatalogRepository(session)
#                 yield repos
# usage:
# async with self.uow() as repos:
#    await repos.curriculums.save(curriculum)

class UnitOfWork:
    """Transaction boundary that exposes repository instances per session.

    The unit of work opens one async SQLAlchemy session, provides typed
    repositories bound to that session, and commits or rolls back on exit.

    :ivar session: Active async database session.
    :vartype session: AsyncSession
    :ivar curriculums: Repository for university curriculum aggregates.
    :vartype curriculums: UniversityCurriculumRepository
    :ivar catalogs: Repository for catalog persistence.
    :vartype catalogs: CatalogRepository
    :ivar career_curriculums: Repository for career-level curriculum entities.
    :vartype career_curriculums: CareerCurriculumRepository
    """
    session: AsyncSession
    curriculums: UniversityCurriculumRepository
    catalogs: CatalogRepository
    career_curriculums: CareerCurriculumRepository

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._session_factory = session_factory

    async def __aenter__(self) -> UnitOfWork:
        # inits the repositories
        self.session = self._session_factory()
        self.curriculums = SqlUniversityCurriculumRepository(self.session)
        self.catalogs = SqlCatalogRepository(self.session)
        self.career_curriculums = SqlCareerCurriculumRepository(self.session)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            await self.session.rollback()
        else:
            await self.session.commit()
        await self.session.close()
