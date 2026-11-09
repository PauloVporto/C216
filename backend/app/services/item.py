from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate


class ItemService:
    def __init__(self, session: AsyncSession):
        self.repository = ItemRepository(session)

    async def list(self):
        return await self.repository.list()

    async def create(self, item: ItemCreate):
        try:
            return await self.repository.create(item)
        except IntegrityError as error:
            await self.repository.session.rollback()
            if (
                getattr(error.orig, "sqlstate", None) == "23505"
                or getattr(error.orig, "sqlite_errorcode", None) == 2067
            ):
                raise HTTPException(
                    status_code=409, detail="Já existe um item com esse nome"
                ) from error
            raise
