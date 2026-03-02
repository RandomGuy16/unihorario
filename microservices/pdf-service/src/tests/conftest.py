import os
from pathlib import Path

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from pdf_service.main import app
from pdf_service.domain.orm_models import Base, CatalogCareerORM, CareerCurriculumORM, YearORM


TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/unihorario_test",
)


@pytest_asyncio.fixture
async def client():
    """Create API client with FastAPI lifespan enabled."""
    # ASGITransport in this httpx version does not run lifespan automatically.
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac


@pytest_asyncio.fixture
async def engine():
    """Create async engine for integration-style DB setup/cleanup."""
    engine = create_async_engine(TEST_DATABASE_URL)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine):
    """Provide an isolated DB session for tests that need direct DB access."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with SessionLocal() as db_session:
        await db_session.execute(delete(CatalogCareerORM))
        await db_session.execute(delete(CareerCurriculumORM))
        await db_session.execute(delete(YearORM))
        await db_session.commit()
        yield db_session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def pdf_bytes():
    """Load sample curriculum PDF fixture bytes."""
    fixture_path = Path(__file__).resolve().parent / "fixtures" / "Programacion_Asignaturas.pdf"
    return fixture_path.read_bytes()
