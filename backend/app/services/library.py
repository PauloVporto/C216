from datetime import date, datetime, timezone

from fastapi import HTTPException

from app.models.library import Book, Loan, Reader
from app.repositories.library import LibraryRepository


def validate_due_date(due_date, today=None):
    if due_date < (today or date.today()):
        raise HTTPException(422, "A devolução prevista não pode estar no passado.")


def validate_capacity(copies, active):
    if copies < active:
        raise HTTPException(
            409, "O total de exemplares não pode ser menor que os empréstimos ativos."
        )


def loan_status(loan, today=None):
    if loan.returned_at:
        return "returned"
    return "overdue" if loan.due_date < (today or date.today()) else "active"


class LibraryService:
    def __init__(self, session):
        self.repo = LibraryRepository(session)

    async def require(self, model, identifier, lock=False):
        obj = await self.repo.get(model, identifier, lock)
        if obj is None:
            raise HTTPException(404, "Registro não encontrado.")
        return obj

    async def books(self):
        return [
            dict(
                id=book.id,
                title=book.title,
                author=book.author,
                category=book.category,
                copies=book.copies,
                active_loans=count,
                available=book.copies - count,
            )
            for book, count in await self.repo.books_with_counts()
        ]

    async def save_book(self, data, identifier=None):
        book = await self.require(Book, identifier, lock=True) if identifier else Book()
        active = await self.repo.active_count(book.id) if identifier else 0
        validate_capacity(data.copies, active)
        for key, value in data.model_dump().items():
            setattr(book, key, value)
        await self.repo.add(book)
        return dict(
            id=book.id,
            **data.model_dump(),
            active_loans=active,
            available=book.copies - active,
        )

    async def delete_book(self, identifier):
        book = await self.require(Book, identifier, lock=True)
        if await self.repo.has_history(Loan.book_id, identifier):
            raise HTTPException(
                409, "Este livro tem histórico de empréstimos e deve ser preservado."
            )
        await self.repo.delete(book)

    async def save_reader(self, data, identifier=None):
        reader = (
            await self.require(Reader, identifier, lock=True)
            if identifier
            else Reader()
        )
        if await self.repo.email_exists(data.email, identifier):
            raise HTTPException(409, "Este e-mail já está cadastrado.")
        for key, value in data.model_dump().items():
            setattr(reader, key, value)
        return await self.repo.add(reader)

    async def delete_reader(self, identifier):
        reader = await self.require(Reader, identifier, lock=True)
        if await self.repo.has_history(Loan.reader_id, identifier):
            raise HTTPException(
                409, "Este leitor tem histórico de empréstimos e deve ser preservado."
            )
        await self.repo.delete(reader)

    async def loans(self):
        return [
            dict(
                id=loan.id,
                book_id=loan.book_id,
                reader_id=loan.reader_id,
                book_title=title,
                reader_name=name,
                loan_date=loan.loan_date,
                due_date=loan.due_date,
                returned_at=loan.returned_at,
                status=loan_status(loan),
            )
            for loan, title, name in await self.repo.loan_details()
        ]

    async def create_loan(self, data):
        validate_due_date(data.due_date)
        # The book row serializes capacity changes and concurrent checkouts in PostgreSQL.
        book = await self.require(Book, data.book_id, lock=True)
        await self.require(Reader, data.reader_id, lock=True)
        if await self.repo.duplicate_loan(data.book_id, data.reader_id):
            raise HTTPException(
                409, "Este leitor já possui um empréstimo ativo deste livro."
            )
        if await self.repo.active_count(book.id) >= book.copies:
            raise HTTPException(409, "Não há exemplares disponíveis para este livro.")
        loan = await self.repo.add(Loan(**data.model_dump(), loan_date=date.today()))
        return next(row for row in await self.loans() if row["id"] == loan.id)

    async def return_loan(self, identifier):
        loan = await self.require(Loan, identifier, lock=True)
        if loan.returned_at:
            raise HTTPException(409, "Este empréstimo já foi devolvido.")
        loan.returned_at = datetime.now(timezone.utc)
        await self.repo.session.flush()
        return next(row for row in await self.loans() if row["id"] == loan.id)
