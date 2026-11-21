from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rentals import Customer, Game, Rental


class RentalRepository:
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

    async def active_count(self, game_id):
        return await self.session.scalar(
            select(func.count())
            .select_from(Rental)
            .where(Rental.game_id == game_id, Rental.returned_at.is_(None))
        )

    async def has_history(self, field, identifier):
        return bool(
            await self.session.scalar(
                select(Rental.id).where(field == identifier).limit(1)
            )
        )

    async def email_exists(self, email, excluding=None):
        query = select(Customer.id).where(Customer.email == email)
        if excluding is not None:
            query = query.where(Customer.id != excluding)
        return bool(await self.session.scalar(query))

    async def duplicate_rental(self, game_id, customer_id):
        return bool(
            await self.session.scalar(
                select(Rental.id).where(
                    Rental.game_id == game_id,
                    Rental.customer_id == customer_id,
                    Rental.returned_at.is_(None),
                )
            )
        )

    async def games_with_counts(self):
        active = (
            select(Rental.game_id, func.count().label("count"))
            .where(Rental.returned_at.is_(None))
            .group_by(Rental.game_id)
            .subquery()
        )
        return (
            await self.session.execute(
                select(Game, func.coalesce(active.c.count, 0))
                .outerjoin(active, Game.id == active.c.game_id)
                .order_by(Game.title)
            )
        ).all()

    async def rental_details(self):
        return (
            await self.session.execute(
                select(Rental, Game.title, Game.platform, Customer.name)
                .join(Game, Rental.game_id == Game.id)
                .join(Customer, Rental.customer_id == Customer.id)
                .order_by(Rental.id.desc())
            )
        ).all()
