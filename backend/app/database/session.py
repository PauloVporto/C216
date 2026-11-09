from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.db import connection


def sqlalchemy_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


@lru_cache
def get_engine(url: str):
    return create_async_engine(sqlalchemy_url(url), poolclass=NullPool)


async def get_session():
    async with AsyncSession(
        get_engine(connection.DATABASE_URL), expire_on_commit=False
    ) as session:
        yield session
