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
