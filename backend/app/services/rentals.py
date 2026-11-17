from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException

from app.models.rentals import Customer, Game, Rental
from app.repositories.rentals import RentalRepository

BUSINESS_TIMEZONE = ZoneInfo("America/Sao_Paulo")


def business_today():
    return datetime.now(BUSINESS_TIMEZONE).date()


def validate_due_date(due_date, today=None):
    if due_date < (today or business_today()):
        raise HTTPException(422, "A devolução prevista não pode estar no passado.")


def validate_capacity(copies, active):
    if copies < active:
        raise HTTPException(
            409, "O total de cópias não pode ser menor que as locações ativas."
        )


def rental_status(rental, today=None):
    if rental.returned_at:
        return "returned"
    return "overdue" if rental.due_date < (today or business_today()) else "active"


def pricing(start_date, due_date, daily_rate_cents, end_date):
    reserved_days = max(1, (due_date - start_date).days)
    late_days = max(0, (end_date - due_date).days)
    days = reserved_days + late_days
    return dict(
        estimated_total_cents=reserved_days * daily_rate_cents,
        total_cents=days * daily_rate_cents,
        billable_days=days,
        late_days=late_days,
    )


class RentalService:
    def __init__(self, session):
        self.repo = RentalRepository(session)

    async def require(self, model, identifier, lock=False):
        obj = await self.repo.get(model, identifier, lock)
        if obj is None:
            raise HTTPException(404, "Registro não encontrado.")
        return obj

    async def games(self):
        return [
            dict(
                id=game.id,
                title=game.title,
                platform=game.platform,
                genre=game.genre,
                copies=game.copies,
                daily_rate_cents=game.daily_rate_cents,
                active_rentals=count,
                available=game.copies - count,
            )
            for game, count in await self.repo.games_with_counts()
        ]

    async def save_game(self, data, identifier=None):
        game = await self.require(Game, identifier, lock=True) if identifier else Game()
        active = await self.repo.active_count(game.id) if identifier else 0
        validate_capacity(data.copies, active)
        for key, value in data.model_dump().items():
            setattr(game, key, value)
        await self.repo.add(game)
        return dict(
            id=game.id,
            **data.model_dump(),
            active_rentals=active,
            available=game.copies - active,
        )

    async def delete_game(self, identifier):
        game = await self.require(Game, identifier, lock=True)
        if await self.repo.has_history(Rental.game_id, identifier):
            raise HTTPException(
                409, "Este jogo tem histórico de locações e deve ser preservado."
            )
        await self.repo.delete(game)

    async def save_customer(self, data, identifier=None):
        customer = (
            await self.require(Customer, identifier, lock=True)
            if identifier
            else Customer()
        )
        if await self.repo.email_exists(data.email, identifier):
            raise HTTPException(409, "Este e-mail já está cadastrado.")
        for key, value in data.model_dump().items():
            setattr(customer, key, value)
        return await self.repo.add(customer)

    async def delete_customer(self, identifier):
        customer = await self.require(Customer, identifier, lock=True)
        if await self.repo.has_history(Rental.customer_id, identifier):
            raise HTTPException(
                409, "Este cliente tem histórico de locações e deve ser preservado."
            )
        await self.repo.delete(customer)

    async def rentals(self):
        rows = []
        for rental, title, platform, name in await self.repo.rental_details():
            returned_at = rental.returned_at
            if returned_at is not None:
                if returned_at.tzinfo is None:
                    returned_at = returned_at.replace(tzinfo=timezone.utc)
                end_date = returned_at.astimezone(BUSINESS_TIMEZONE).date()
            else:
                end_date = business_today()
            amounts = pricing(
                rental.start_date, rental.due_date, rental.daily_rate_cents, end_date
            )
            if rental.total_cents is not None:
                amounts["total_cents"] = rental.total_cents
            rows.append(
                dict(
                    id=rental.id,
                    game_id=rental.game_id,
                    customer_id=rental.customer_id,
                    game_title=title,
                    platform=platform,
                    customer_name=name,
                    start_date=rental.start_date,
                    due_date=rental.due_date,
                    daily_rate_cents=rental.daily_rate_cents,
                    returned_at=returned_at,
                    status=rental_status(rental),
                    **amounts,
                )
            )
        return rows

    async def create_rental(self, data):
        today = business_today()
        validate_due_date(data.due_date, today)
        # Serialize competing rentals and stock changes on the same game in PostgreSQL.
        game = await self.require(Game, data.game_id, lock=True)
        await self.require(Customer, data.customer_id, lock=True)
        if await self.repo.duplicate_rental(data.game_id, data.customer_id):
            raise HTTPException(
                409, "Este cliente já possui uma locação ativa deste jogo."
            )
        if await self.repo.active_count(game.id) >= game.copies:
            raise HTTPException(409, "Não há cópias disponíveis para este jogo.")
        rental = await self.repo.add(
            Rental(
                **data.model_dump(),
                start_date=today,
                daily_rate_cents=game.daily_rate_cents,
            )
        )
        return next(row for row in await self.rentals() if row["id"] == rental.id)

    async def return_rental(self, identifier):
        rental = await self.require(Rental, identifier, lock=True)
        if rental.returned_at:
            raise HTTPException(409, "Esta locação já foi encerrada.")
        now = datetime.now(timezone.utc)
        rental.returned_at = now
        rental.total_cents = pricing(
            rental.start_date,
            rental.due_date,
            rental.daily_rate_cents,
            now.astimezone(BUSINESS_TIMEZONE).date(),
        )["total_cents"]
        await self.repo.session.flush()
        return next(row for row in await self.rentals() if row["id"] == rental.id)
