from fastapi import HTTPException, status

from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate


class BookService:
    def __init__(self):
        self._books: dict[int, Book] = {}
        self._next_id = 1

    def clear(self):
        self._books.clear()
        self._next_id = 1

    def list_books(self, available: bool | None = None) -> list[Book]:
        books = list(self._books.values())
        if available is None:
            return books
        return [book for book in books if book.available is available]

    def get_book(self, book_id: int) -> Book:
        book = self._books.get(book_id)
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Livro não encontrado",
            )
        return book

    def create_book(self, payload: BookCreate) -> Book:
        book = Book(id=self._next_id, **payload.model_dump())
        self._books[book.id] = book
        self._next_id += 1
        return book

    def replace_book(self, book_id: int, payload: BookUpdate) -> Book:
        self.get_book(book_id)
        book = Book(id=book_id, **payload.model_dump())
        self._books[book_id] = book
        return book

    def patch_book(self, book_id: int, payload: BookPatch) -> Book:
        current = self.get_book(book_id)
        data = current.model_dump()
        updates = payload.model_dump(exclude_unset=True)
        data.update(updates)
        book = Book(**data)
        self._books[book_id] = book
        return book

    def delete_book(self, book_id: int) -> None:
        self.get_book(book_id)
        del self._books[book_id]


book_service = BookService()
