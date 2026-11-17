"""Create the library catalog, readers and loan history."""

import sqlalchemy as sa

from alembic import op

revision = "001_library"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "books",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("author", sa.String(140), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("copies", sa.Integer(), nullable=False),
        sa.CheckConstraint("copies >= 1", name="ck_books_copies"),
    )
    op.create_table(
        "readers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("email", sa.String(180), nullable=False, unique=True),
    )
    op.create_table(
        "loans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "book_id",
            sa.Integer(),
            sa.ForeignKey("books.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "reader_id",
            sa.Integer(),
            sa.ForeignKey("readers.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("loan_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint("due_date >= loan_date", name="ck_loans_due_date"),
    )
    op.create_index("ix_loans_book_id", "loans", ["book_id"])
    op.create_index("ix_loans_reader_id", "loans", ["reader_id"])
    op.create_index(
        "uq_active_reader_book",
        "loans",
        ["reader_id", "book_id"],
        unique=True,
        postgresql_where=sa.text("returned_at IS NULL"),
        sqlite_where=sa.text("returned_at IS NULL"),
    )


def downgrade():
    op.drop_table("loans")
    op.drop_table("readers")
    op.drop_table("books")
