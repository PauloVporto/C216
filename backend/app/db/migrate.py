"""Aplica migrações SQL versionadas sem apagar dados existentes."""
import asyncio
from pathlib import Path
from app.db.connection import connection

async def migrate():
    async with connection() as conn:
        await conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)")
        for path in sorted(Path(__file__).with_name("migrations").glob("*.sql")):
            async with conn.transaction():
                if not await conn.fetchval("SELECT 1 FROM schema_migrations WHERE version=$1", path.stem):
                    await conn.execute(path.read_text())
                    await conn.execute("INSERT INTO schema_migrations VALUES ($1)", path.stem)
            print(f"{path.stem} (head)")

if __name__ == "__main__":
    asyncio.run(migrate())
