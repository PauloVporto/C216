import asyncpg
from fastapi import HTTPException
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate

class ItemService:
    def __init__(self):
        self.repository = ItemRepository()

    async def list(self):
        return await self.repository.list()

    async def create(self, item: ItemCreate):
        try:
            return await self.repository.create(item)
        except asyncpg.UniqueViolationError as error:
            raise HTTPException(status_code=409, detail="Já existe um item com esse nome") from error
