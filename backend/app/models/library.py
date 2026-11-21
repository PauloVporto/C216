"""Legacy tables retained to preserve data created before the game-rental domain."""

from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Book(Base):
    __tablename__ = "books"
    __table_args__ = (CheckConstraint("copies >= 1", name="ck_books_copies"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    author: Mapped[str] = mapped_column(String(140))
    category: Mapped[str] = mapped_column(String(80))
    copies: Mapped[int] = mapped_column(Integer, default=1)


class Reader(Base):
    __tablename__ = "readers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(140))
    email: Mapped[str] = mapped_column(String(180), unique=True)


class Loan(Base):
    __tablename__ = "loans"
    __table_args__ = (
        CheckConstraint("due_date >= loan_date", name="ck_loans_due_date"),
        Index(
            "uq_active_reader_book",
            "reader_id",
            "book_id",
            unique=True,
            postgresql_where=text("returned_at IS NULL"),
            sqlite_where=text("returned_at IS NULL"),
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="RESTRICT"), index=True
    )
    reader_id: Mapped[int] = mapped_column(
        ForeignKey("readers.id", ondelete="RESTRICT"), index=True
    )
    loan_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
