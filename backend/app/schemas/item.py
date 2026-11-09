from pydantic import BaseModel, ConfigDict, Field


class ItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class ItemRead(ItemCreate):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)
    id: int
