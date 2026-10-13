from fastapi import HTTPException

from app.db.connection import connection
from app.schemas.book import Book, BookCreate, BookPatch, BookUpdate


class BookService:
    async def list_books(self, available: bool | None = None) -> list[Book]:
        async with connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM books WHERE ($1::boolean IS NULL OR available=$1) ORDER BY id",
                available,
            )
        return [Book(**dict(row)) for row in rows]

    async def get_book(self, book_id: int) -> Book:
        async with connection() as conn:
            row = await conn.fetchrow("SELECT * FROM books WHERE id=$1", book_id)
        return self._book(row)

    async def create_book(self, payload: BookCreate) -> Book:
        async with connection() as conn:
            row = await conn.fetchrow(
                "INSERT INTO books (title, author, available) VALUES ($1,$2,$3) RETURNING *",
                payload.title, payload.author, payload.available,
            )
        return self._book(row)

    async def replace_book(self, book_id: int, payload: BookUpdate) -> Book:
        async with connection() as conn:
            row = await conn.fetchrow(
                "UPDATE books SET title=$1, author=$2, available=$3 WHERE id=$4 RETURNING *",
                payload.title, payload.author, payload.available, book_id,
            )
        return self._book(row)

    async def patch_book(self, book_id: int, payload: BookPatch) -> Book:
        updates = payload.model_dump(exclude_unset=True)
        if not updates:
            return await self.get_book(book_id)
        # Os nomes vêm exclusivamente dos campos validados pelo schema.
        columns = list(updates)
        assignments = ", ".join(f"{column}=${i}" for i, column in enumerate(columns, 1))
        async with connection() as conn:
            row = await conn.fetchrow(
                f"UPDATE books SET {assignments} WHERE id=${len(columns)+1} RETURNING *",
                *updates.values(), book_id,
            )
        return self._book(row)

    async def delete_book(self, book_id: int) -> None:
        async with connection() as conn:
            result = await conn.execute("DELETE FROM books WHERE id=$1", book_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Livro não encontrado")

    @staticmethod
    def _book(row):
        if row is None:
            raise HTTPException(status_code=404, detail="Livro não encontrado")
        return Book(**dict(row))


book_service = BookService()
