from app.db.connection import connection
from app.schemas.item import ItemCreate, ItemRead

class ItemRepository:
    async def list(self):
        async with connection() as conn:
            rows = await conn.fetch("SELECT id, name, description FROM items ORDER BY id")
        return [ItemRead(**dict(row)) for row in rows]

    async def create(self, item: ItemCreate):
        async with connection() as conn:
            row = await conn.fetchrow(
                "INSERT INTO items (name, description) VALUES ($1, $2) RETURNING id, name, description",
                item.name, item.description,
            )
        return ItemRead(**dict(row))
