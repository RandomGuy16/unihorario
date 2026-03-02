from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from pdf_service.domain.repositories import (
    SqlCatalogRepository,
    SqlCareerCurriculumRepository,
    SqlUniversityCurriculumRepository
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
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._session_factory = session_factory

    async def __aenter__(self):
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
