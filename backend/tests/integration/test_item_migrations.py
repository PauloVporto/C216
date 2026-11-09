import sqlite3
from io import StringIO
from pathlib import Path

import pytest
from alembic.config import Config

from alembic import command

pytestmark = pytest.mark.integration


def migration_config(database):
    root = Path(__file__).resolve().parents[2]
    config = Config(str(root / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", f"sqlite+aiosqlite:///{database}")
    return config


def test_alembic_upgrade_new_database_and_current_head(tmp_path):
    database = tmp_path / "new.db"
    config = migration_config(database)
    command.upgrade(config, "head")
    command.upgrade(config, "head")
    config.stdout = StringIO()
    command.current(config)
    assert "007_items (head)" in config.stdout.getvalue()
    with sqlite3.connect(database) as connection:
        assert connection.execute(
            "SELECT version_num FROM alembic_version"
        ).fetchone() == ("007_items",)
        connection.execute("INSERT INTO items (name) VALUES ('Notebook')")
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute("INSERT INTO items (name) VALUES ('Notebook')")


def test_alembic_preserves_existing_items(tmp_path):
    database = tmp_path / "existing.db"
    with sqlite3.connect(database) as connection:
        connection.execute(
            "CREATE TABLE items (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE "
            "CHECK (length(trim(name)) > 0), description TEXT)"
        )
        connection.execute("INSERT INTO items VALUES (7, 'Existente', 'Preservar')")
    command.upgrade(migration_config(database), "head")
    with sqlite3.connect(database) as connection:
        assert connection.execute("SELECT * FROM items").fetchall() == [
            (7, "Existente", "Preservar")
        ]
        assert connection.execute(
            "SELECT version_num FROM alembic_version"
        ).fetchone() == ("007_items",)
