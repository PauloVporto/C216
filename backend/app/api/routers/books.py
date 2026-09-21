from fastapi import APIRouter, Query, status

from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate
from app.services.book_service import book_service

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[Book])
def list_books(available: bool | None = Query(default=None)):
    return book_service.list_books(available=available)


@router.get("/{book_id}", response_model=Book)
def get_book(book_id: int):
    return book_service.get_book(book_id)


@router.post("", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookCreate):
    return book_service.create_book(payload)


@router.put("/{book_id}", response_model=Book)
def replace_book(book_id: int, payload: BookUpdate):
    return book_service.replace_book(book_id, payload)


@router.patch("/{book_id}", response_model=Book)
def patch_book(book_id: int, payload: BookPatch):
    return book_service.patch_book(book_id, payload)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int):
    book_service.delete_book(book_id)
