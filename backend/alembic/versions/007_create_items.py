"""Cria items; preserva registros da versão anterior da prática 7.

Revision ID: 007_items
Revises:
"""

import sqlalchemy as sa

from alembic import op

revision = "007_items"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # A versão anterior já podia ter criado esta mesma tabela em PostgreSQL.
    if not sa.inspect(op.get_bind()).has_table("items"):
        op.create_table(
            "items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(100), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.UniqueConstraint("name"),
            sa.CheckConstraint("length(trim(name)) > 0", name="ck_items_name_nonempty"),
        )


def downgrade():
    op.drop_table("items")
