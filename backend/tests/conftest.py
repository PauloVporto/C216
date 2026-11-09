import asyncio
import os
from pathlib import Path

import asyncpg
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    url = os.getenv("TEST_DATABASE_URL")
    if not url:
        pytest.fail("Defina TEST_DATABASE_URL para um banco exclusivo de testes")

    async def prepare():
        conn = await asyncpg.connect(url)
        try:
            await conn.execute(Path("app/db/init.sql").read_text())
            await conn.execute("TRUNCATE books, students RESTART IDENTITY")
        finally:
            await conn.close()

    asyncio.run(prepare())
    from app.db import connection

    original = connection.DATABASE_URL
    connection.DATABASE_URL = url
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        connection.DATABASE_URL = original


@pytest.fixture
def items_client():
    """API items isolada em SQLite em memória; E2E usa PostgreSQL real."""
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.pool import StaticPool

    from app.database.session import get_session
    from app.models.item import Base

    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)

    async def prepare_items():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def override_session():
        async with AsyncSession(engine, expire_on_commit=False) as session:
            yield session

    asyncio.run(prepare_items())
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_session, None)
        asyncio.run(engine.dispose())
