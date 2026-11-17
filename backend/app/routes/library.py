from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_session
from app.models.library import Reader
from app.schemas.library import (
    BookInput,
    BookOutput,
    LoanInput,
    LoanOutput,
    ReaderInput,
    ReaderOutput,
)
from app.services.library import LibraryService

router = APIRouter(prefix="/api")


def service(session: AsyncSession = Depends(get_session)):
    return LibraryService(session)


@router.get("/books", response_model=list[BookOutput], tags=["Livros"])
async def books(svc: LibraryService = Depends(service)):
    return await svc.books()


@router.post("/books", response_model=BookOutput, status_code=201, tags=["Livros"])
async def create_book(data: BookInput, svc: LibraryService = Depends(service)):
    return await svc.save_book(data)


@router.put("/books/{identifier}", response_model=BookOutput, tags=["Livros"])
async def update_book(
    identifier: int, data: BookInput, svc: LibraryService = Depends(service)
):
    return await svc.save_book(data, identifier)


@router.delete("/books/{identifier}", status_code=204, tags=["Livros"])
async def delete_book(identifier: int, svc: LibraryService = Depends(service)):
    await svc.delete_book(identifier)
    return Response(status_code=204)


@router.get("/readers", response_model=list[ReaderOutput], tags=["Leitores"])
async def readers(svc: LibraryService = Depends(service)):
    return await svc.repo.all(Reader)


@router.post(
    "/readers", response_model=ReaderOutput, status_code=201, tags=["Leitores"]
)
async def create_reader(data: ReaderInput, svc: LibraryService = Depends(service)):
    return await svc.save_reader(data)


@router.put("/readers/{identifier}", response_model=ReaderOutput, tags=["Leitores"])
async def update_reader(
    identifier: int, data: ReaderInput, svc: LibraryService = Depends(service)
):
    return await svc.save_reader(data, identifier)


@router.delete("/readers/{identifier}", status_code=204, tags=["Leitores"])
async def delete_reader(identifier: int, svc: LibraryService = Depends(service)):
    await svc.delete_reader(identifier)
    return Response(status_code=204)


@router.get("/loans", response_model=list[LoanOutput], tags=["Empréstimos"])
async def loans(svc: LibraryService = Depends(service)):
    return await svc.loans()


@router.post("/loans", response_model=LoanOutput, status_code=201, tags=["Empréstimos"])
async def create_loan(data: LoanInput, svc: LibraryService = Depends(service)):
    return await svc.create_loan(data)


@router.post(
    "/loans/{identifier}/return", response_model=LoanOutput, tags=["Empréstimos"]
)
async def return_loan(identifier: int, svc: LibraryService = Depends(service)):
    return await svc.return_loan(identifier)
