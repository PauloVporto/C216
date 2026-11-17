from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.library import Book, Loan, Reader


class LibraryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, model, identifier, lock=False):
        query = select(model).where(model.id == identifier)
        if lock:
            query = query.with_for_update()
        return await self.session.scalar(query)

    async def all(self, model):
        return list(await self.session.scalars(select(model).order_by(model.id.desc())))

    async def add(self, model):
        self.session.add(model)
        await self.session.flush()
        return model

    async def delete(self, model):
        await self.session.delete(model)
        await self.session.flush()

    async def active_count(self, book_id):
        return await self.session.scalar(
            select(func.count())
            .select_from(Loan)
            .where(Loan.book_id == book_id, Loan.returned_at.is_(None))
        )

    async def has_history(self, field, identifier):
        return bool(
            await self.session.scalar(
                select(Loan.id).where(field == identifier).limit(1)
            )
        )

    async def email_exists(self, email, excluding=None):
        query = select(Reader.id).where(Reader.email == email)
        if excluding is not None:
            query = query.where(Reader.id != excluding)
        return bool(await self.session.scalar(query))

    async def duplicate_loan(self, book_id, reader_id):
        return bool(
            await self.session.scalar(
                select(Loan.id).where(
                    Loan.book_id == book_id,
                    Loan.reader_id == reader_id,
                    Loan.returned_at.is_(None),
                )
            )
        )

    async def books_with_counts(self):
        active = (
            select(Loan.book_id, func.count().label("count"))
            .where(Loan.returned_at.is_(None))
            .group_by(Loan.book_id)
            .subquery()
        )
        return (
            await self.session.execute(
                select(Book, func.coalesce(active.c.count, 0))
                .outerjoin(active, Book.id == active.c.book_id)
                .order_by(Book.title)
            )
        ).all()

    async def loan_details(self):
        return (
            await self.session.execute(
                select(Loan, Book.title, Reader.name)
                .join(Book, Loan.book_id == Book.id)
                .join(Reader, Loan.reader_id == Reader.id)
                .order_by(Loan.id.desc())
            )
        ).all()
