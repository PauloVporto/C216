import re
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=180)
]
Name = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)
]
Platform = Literal["PS5", "PS4", "Xbox Series", "Xbox One", "Nintendo Switch", "PC"]


class GameInput(BaseModel):
    title: Title
    platform: Platform
    genre: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)
    ]
    copies: int = Field(ge=1, le=10000, strict=True)
    daily_rate_cents: int = Field(ge=1, le=1000000, strict=True)


class GameOutput(GameInput):
    id: int
    available: int
    active_rentals: int


class CustomerInput(BaseModel):
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


class CustomerOutput(CustomerInput):
    model_config = ConfigDict(from_attributes=True)
    id: int


class RentalInput(BaseModel):
    game_id: int = Field(gt=0)
    customer_id: int = Field(gt=0)
    due_date: date


class RentalOutput(BaseModel):
    id: int
    game_id: int
    customer_id: int
    game_title: str
    platform: str
    customer_name: str
    start_date: date
    due_date: date
    daily_rate_cents: int
    estimated_total_cents: int
    total_cents: int
    billable_days: int
    late_days: int
    returned_at: datetime | None
    status: Literal["active", "overdue", "returned"]
