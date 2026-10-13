from fastapi import HTTPException
from app.db.connection import connection
from app.schemas.student import Student, StudentCreate

class StudentService:
    @staticmethod
    def _student(row):
        if row is None:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        return Student(**dict(row))

    async def listar(self, curso: str | None = None):
        async with connection() as conn:
            rows = await conn.fetch("SELECT * FROM students WHERE ($1::text IS NULL OR curso=$1) ORDER BY id", curso)
        return [Student(**dict(row)) for row in rows]

    async def buscar(self, aluno_id: int):
        async with connection() as conn:
            row = await conn.fetchrow("SELECT * FROM students WHERE id=$1", aluno_id)
        return self._student(row)

    async def criar(self, aluno: StudentCreate):
        async with connection() as conn:
            row = await conn.fetchrow("INSERT INTO students (nome, curso, email) VALUES ($1,$2,$3) RETURNING *", aluno.nome, aluno.curso, aluno.email)
        return self._student(row)

    async def atualizar(self, aluno_id: int, aluno: StudentCreate):
        async with connection() as conn:
            row = await conn.fetchrow("UPDATE students SET nome=$1, curso=$2, email=$3 WHERE id=$4 RETURNING *", aluno.nome, aluno.curso, aluno.email, aluno_id)
        return self._student(row)

    async def deletar(self, aluno_id: int):
        async with connection() as conn:
            result = await conn.execute("DELETE FROM students WHERE id=$1", aluno_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
