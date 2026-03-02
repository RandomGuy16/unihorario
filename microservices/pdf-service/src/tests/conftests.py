import pytest
import pytest_asyncio
import asyncio
import os
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from httpx import ASGITransport, AsyncClient
from pdf_service.main import app
from pdf_service.domain.orm_models import Base, CatalogCareerORM, CareerCurriculumORM, YearORM


TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/unihorario_test",
)

@pytest_asyncio.fixture
async def client():
    """Create API client with app lifespan enabled."""
    # ASGITransport in this httpx version does not run lifespan automatically.
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac


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