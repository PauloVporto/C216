"""Add a game rental domain; preserve all legacy library records."""

import sqlalchemy as sa

from alembic import op

revision = "002_game_rentals"
down_revision = "001_library"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "games",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("platform", sa.String(40), nullable=False),
        sa.Column("genre", sa.String(80), nullable=False),
        sa.Column("copies", sa.Integer(), nullable=False),
        sa.Column("daily_rate_cents", sa.Integer(), nullable=False),
        sa.CheckConstraint("copies >= 1", name="ck_games_copies"),
        sa.CheckConstraint("daily_rate_cents > 0", name="ck_games_daily_rate"),
    )
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("email", sa.String(180), nullable=False, unique=True),
    )
    op.create_table(
        "rentals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "game_id",
            sa.Integer(),
            sa.ForeignKey("games.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.Integer(),
            sa.ForeignKey("customers.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("daily_rate_cents", sa.Integer(), nullable=False),
        sa.Column("total_cents", sa.BigInteger(), nullable=True),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("due_date >= start_date", name="ck_rentals_due_date"),
        sa.CheckConstraint("daily_rate_cents > 0", name="ck_rentals_daily_rate"),
        sa.CheckConstraint(
            "total_cents IS NULL OR total_cents > 0", name="ck_rentals_total"
        ),
    )
    op.create_index("ix_rentals_game_id", "rentals", ["game_id"])
    op.create_index("ix_rentals_customer_id", "rentals", ["customer_id"])
    op.create_index(
        "uq_active_customer_game",
        "rentals",
        ["customer_id", "game_id"],
        unique=True,
        postgresql_where=sa.text("returned_at IS NULL"),
        sqlite_where=sa.text("returned_at IS NULL"),
    )


def downgrade():
    op.drop_table("rentals")
    op.drop_table("customers")
    op.drop_table("games")
