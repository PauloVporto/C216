import os
import subprocess
import sys

from sqlalchemy import create_engine, inspect, text


def test_migration_preserves_legacy_and_roundtrips(tmp_path):
    path = tmp_path / "migration.db"
    env = {**os.environ, "DATABASE_URL": f"sqlite+aiosqlite:///{path}"}

    def migrate(*target):
        subprocess.run(
            [sys.executable, "-m", "alembic", *target],
            env=env,
            check=True,
            capture_output=True,
        )

    migrate("upgrade", "001_library")
    engine = create_engine(f"sqlite:///{path}")
    with engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO books (title, author, category, copies) VALUES ('Registro preservado', 'Autor', 'Legado', 1)"
            )
        )
    migrate("upgrade", "head")
    assert {"games", "customers", "rentals", "books"} <= set(
        inspect(engine).get_table_names()
    )
    with engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT version_num FROM alembic_version"))
            == "002_game_rentals"
        )
        assert (
            connection.scalar(text("SELECT title FROM books")) == "Registro preservado"
        )
    migrate("downgrade", "001_library")
    assert "games" not in inspect(engine).get_table_names()
    with engine.connect() as connection:
        assert (
            connection.scalar(text("SELECT title FROM books")) == "Registro preservado"
        )
    migrate("upgrade", "head")
    assert "rentals" in inspect(engine).get_table_names()
    engine.dispose()
