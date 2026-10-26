from pydantic import BaseModel, Field

class StudentCreate(BaseModel):
    nome: str = Field(min_length=1)
    curso: str = Field(min_length=1)
    email: str = Field(min_length=1)

class Student(StudentCreate):
    id: int
