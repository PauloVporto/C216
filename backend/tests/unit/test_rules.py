from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.schemas.library import ReaderInput
from app.services.library import loan_status, validate_capacity, validate_due_date


def test_cannot_reduce_stock_below_active_loans():
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
    loan = SimpleNamespace(due_date=today, returned_at=None)
    assert loan_status(loan, today) == "active"
    loan.due_date -= timedelta(days=1)
    assert loan_status(loan, today) == "overdue"
    loan.returned_at = datetime.now(timezone.utc)
    assert loan_status(loan, today) == "returned"


def test_normalize_reader_email():
    reader = ReaderInput(name=" Ana ", email=" ANA@EXAMPLE.COM ")
    assert reader.name == "Ana"
    assert reader.email == "ana@example.com"
