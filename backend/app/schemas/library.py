import re
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=180)
]
Name = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)
]


class BookInput(BaseModel):
    title: Title
    author: Name
    category: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)
    ]
    copies: int = Field(ge=1, le=10000, strict=True)


class BookOutput(BookInput):
    id: int
    available: int
    active_loans: int


class ReaderInput(BaseModel):
    name: Name
    email: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=3, max_length=180)
    ]

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        value = value.lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Informe um e-mail válido")
        return value


class ReaderOutput(ReaderInput):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LoanInput(BaseModel):
    book_id: int = Field(gt=0)
    reader_id: int = Field(gt=0)
    due_date: date


class LoanOutput(BaseModel):
    id: int
    book_id: int
    reader_id: int
    book_title: str
    reader_name: str
    loan_date: date
    due_date: date
    returned_at: datetime | None
    status: str
