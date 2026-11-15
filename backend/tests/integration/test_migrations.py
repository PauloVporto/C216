import os
import subprocess
import sys

from sqlalchemy import create_engine, inspect, text


def test_migration_upgrade_downgrade_roundtrip(tmp_path):
    path = tmp_path / "migration.db"
    env = {**os.environ, "DATABASE_URL": f"sqlite+aiosqlite:///{path}"}

    def migrate(target):
        subprocess.run(
            [sys.executable, "-m", "alembic", *target],
            env=env,
            check=True,
            capture_output=True,
        )

    migrate(["upgrade", "head"])
    engine = create_engine(f"sqlite:///{path}")
    assert {"books", "readers", "loans"} <= set(inspect(engine).get_table_names())
    with engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT version_num FROM alembic_version"))
            == "001_library"
        )
    engine.dispose()
    migrate(["downgrade", "base"])
    engine = create_engine(f"sqlite:///{path}")
    assert "books" not in inspect(engine).get_table_names()
    engine.dispose()
    migrate(["upgrade", "head"])
