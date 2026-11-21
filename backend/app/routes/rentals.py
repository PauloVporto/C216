from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_session
from app.models.rentals import Customer
from app.schemas.rentals import (
    CustomerInput,
    CustomerOutput,
    GameInput,
    GameOutput,
    RentalInput,
    RentalOutput,
)
from app.services.rentals import RentalService

router = APIRouter(prefix="/api")


def service(session: AsyncSession = Depends(get_session)):
    return RentalService(session)


@router.get("/games", response_model=list[GameOutput], tags=["Jogos"])
async def games(svc: RentalService = Depends(service)):
    return await svc.games()


@router.post("/games", response_model=GameOutput, status_code=201, tags=["Jogos"])
async def create_game(data: GameInput, svc: RentalService = Depends(service)):
    return await svc.save_game(data)


@router.put("/games/{identifier}", response_model=GameOutput, tags=["Jogos"])
async def update_game(
    identifier: int, data: GameInput, svc: RentalService = Depends(service)
):
    return await svc.save_game(data, identifier)


@router.delete("/games/{identifier}", status_code=204, tags=["Jogos"])
async def delete_game(identifier: int, svc: RentalService = Depends(service)):
    await svc.delete_game(identifier)
    return Response(status_code=204)


@router.get("/customers", response_model=list[CustomerOutput], tags=["Clientes"])
async def customers(svc: RentalService = Depends(service)):
    return await svc.repo.all(Customer)


@router.post(
    "/customers", response_model=CustomerOutput, status_code=201, tags=["Clientes"]
)
async def create_customer(data: CustomerInput, svc: RentalService = Depends(service)):
    return await svc.save_customer(data)


@router.put("/customers/{identifier}", response_model=CustomerOutput, tags=["Clientes"])
async def update_customer(
    identifier: int, data: CustomerInput, svc: RentalService = Depends(service)
):
    return await svc.save_customer(data, identifier)


@router.delete("/customers/{identifier}", status_code=204, tags=["Clientes"])
async def delete_customer(identifier: int, svc: RentalService = Depends(service)):
    await svc.delete_customer(identifier)
    return Response(status_code=204)


@router.get("/rentals", response_model=list[RentalOutput], tags=["Locações"])
async def rentals(svc: RentalService = Depends(service)):
    return await svc.rentals()


@router.post(
    "/rentals", response_model=RentalOutput, status_code=201, tags=["Locações"]
)
async def create_rental(data: RentalInput, svc: RentalService = Depends(service)):
    return await svc.create_rental(data)


@router.post(
    "/rentals/{identifier}/return", response_model=RentalOutput, tags=["Locações"]
)
async def return_rental(identifier: int, svc: RentalService = Depends(service)):
    return await svc.return_rental(identifier)
