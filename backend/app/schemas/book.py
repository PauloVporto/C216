from pydantic import BaseModel, Field


class BookCreate(BaseModel):
    title: str = Field(min_length=1)
    author: str = Field(min_length=1)
    available: bool = True


class BookUpdate(BaseModel):
    title: str = Field(min_length=1)
    author: str = Field(min_length=1)
    available: bool


class BookPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    author: str | None = Field(default=None, min_length=1)
    available: bool | None = None


class Book(BaseModel):
    id: int
    title: str
    author: str
    available: bool
