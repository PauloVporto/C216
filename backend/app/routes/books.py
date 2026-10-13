from fastapi import APIRouter, Query, status

from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate
from app.services.book_service import book_service

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[Book])
async def list_books(available: bool | None = Query(default=None)):
    return await book_service.list_books(available=available)


@router.get("/{book_id}", response_model=Book)
async def get_book(book_id: int):
    return await book_service.get_book(book_id)


@router.post("", response_model=Book, status_code=status.HTTP_201_CREATED)
async def create_book(payload: BookCreate):
    return await book_service.create_book(payload)


@router.put("/{book_id}", response_model=Book)
async def replace_book(book_id: int, payload: BookUpdate):
    return await book_service.replace_book(book_id, payload)


@router.patch("/{book_id}", response_model=Book)
async def patch_book(book_id: int, payload: BookPatch):
    return await book_service.patch_book(book_id, payload)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: int):
    await book_service.delete_book(book_id)
