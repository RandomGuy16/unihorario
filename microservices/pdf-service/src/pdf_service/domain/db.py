from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from pdf_service.core.config import DATABASE_URL


engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

# the session with the database
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

async def get_db():
    """Yield one async DB session for request-scoped dependency injection.

    :yield: Open async SQLAlchemy session.
    :rtype: AsyncIterator[AsyncSession]
    """
    async with SessionLocal() as session:
        yield session

