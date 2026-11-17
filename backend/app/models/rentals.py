"""Game rental inventory and financial snapshots, separate from legacy library data."""

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
from sqlalchemy.orm import Mapped, mapped_column

from app.models.library import Base


class Game(Base):
    __tablename__ = "games"
    __table_args__ = (
        CheckConstraint("copies >= 1", name="ck_games_copies"),
        CheckConstraint("daily_rate_cents > 0", name="ck_games_daily_rate"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    platform: Mapped[str] = mapped_column(String(40))
    genre: Mapped[str] = mapped_column(String(80))
    copies: Mapped[int] = mapped_column(Integer)
    daily_rate_cents: Mapped[int] = mapped_column(Integer)


class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(140))
    email: Mapped[str] = mapped_column(String(180), unique=True)


class Rental(Base):
    __tablename__ = "rentals"
    __table_args__ = (
        CheckConstraint("due_date >= start_date", name="ck_rentals_due_date"),
        CheckConstraint("daily_rate_cents > 0", name="ck_rentals_daily_rate"),
        CheckConstraint(
            "total_cents IS NULL OR total_cents > 0", name="ck_rentals_total"
        ),
        Index(
            "uq_active_customer_game",
            "customer_id",
            "game_id",
            unique=True,
            postgresql_where=text("returned_at IS NULL"),
            sqlite_where=text("returned_at IS NULL"),
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(
        ForeignKey("games.id", ondelete="RESTRICT"), index=True
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"), index=True
    )
    start_date: Mapped[date] = mapped_column(Date)
    due_date: Mapped[date] = mapped_column(Date)
    daily_rate_cents: Mapped[int] = mapped_column(Integer)
    total_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
