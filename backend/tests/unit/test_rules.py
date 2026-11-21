from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.schemas.rentals import CustomerInput
from app.services.rentals import (
    pricing,
    rental_status,
    validate_capacity,
    validate_due_date,
)


def test_cannot_reduce_stock_below_active_rentals():
    validate_capacity(2, 2)
    with pytest.raises(HTTPException) as error:
        validate_capacity(1, 2)
    assert error.value.status_code == 409


def test_due_date_cannot_be_in_the_past():
    today = date(2026, 11, 15)
    validate_due_date(today, today)
    with pytest.raises(HTTPException):
        validate_due_date(today - timedelta(days=1), today)


def test_status_respects_due_date_and_return():
    today = date(2026, 11, 15)
    rental = SimpleNamespace(due_date=today, returned_at=None)
    assert rental_status(rental, today) == "active"
    rental.due_date -= timedelta(days=1)
    assert rental_status(rental, today) == "overdue"
    rental.returned_at = datetime.now(timezone.utc)
    assert rental_status(rental, today) == "returned"


def test_normalize_customer_email():
    customer = CustomerInput(name=" Ana ", email=" ANA@EXAMPLE.COM ")
    assert customer.name == "Ana"
    assert customer.email == "ana@example.com"


@pytest.mark.parametrize(
    "due, end, expected_days, expected_late",
    [
        (date(2026, 11, 17), date(2026, 11, 17), 1, 0),
        (date(2026, 11, 20), date(2026, 11, 18), 3, 0),
        (date(2026, 11, 20), date(2026, 11, 20), 3, 0),
        (date(2026, 11, 20), date(2026, 11, 22), 5, 2),
    ],
)
def test_daily_pricing_minimum_reserved_period_and_late_days(
    due, end, expected_days, expected_late
):
    result = pricing(date(2026, 11, 17), due, 1299, end)
    assert result["billable_days"] == expected_days
    assert result["late_days"] == expected_late
    assert result["total_cents"] == expected_days * 1299
