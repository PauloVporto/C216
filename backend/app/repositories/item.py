from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item
from app.schemas.item import ItemCreate


class ItemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self):
        return list(await self.session.scalars(select(Item).order_by(Item.id)))

    async def create(self, values: ItemCreate):
        item = Item(**values.model_dump())
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item
