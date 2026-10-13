from pydantic import BaseModel, Field, model_validator


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


    @model_validator(mode="after")
    def reject_explicit_null(self):
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Campos enviados não podem ser nulos")
        return self


class Book(BaseModel):
    id: int
    title: str
    author: str
    available: bool
