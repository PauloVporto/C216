from fastapi import APIRouter
from app.schemas.student import Student, StudentCreate
from app.services.student_service import StudentService

router = APIRouter(prefix="/alunos", tags=["alunos"])
service = StudentService()

@router.get("", response_model=list[Student])
async def listar(curso: str | None = None):
    return await service.listar(curso)

@router.get("/{aluno_id}", response_model=Student)
async def buscar(aluno_id: int):
    return await service.buscar(aluno_id)

@router.post("", response_model=Student, status_code=201)
async def criar(aluno: StudentCreate):
    return await service.criar(aluno)

@router.put("/{aluno_id}", response_model=Student)
async def atualizar(aluno_id: int, aluno: StudentCreate):
    return await service.atualizar(aluno_id, aluno)

@router.delete("/{aluno_id}", status_code=204)
async def deletar(aluno_id: int):
    await service.deletar(aluno_id)
