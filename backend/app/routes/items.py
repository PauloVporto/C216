from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_session
from app.schemas.item import ItemCreate, ItemRead
from app.services.item import ItemService

router = APIRouter(prefix="/items", tags=["items"])
Session = Annotated[AsyncSession, Depends(get_session)]


@router.get("/", response_model=list[ItemRead])
async def list_items(session: Session):
    return await ItemService(session).list()


@router.post("/", response_model=ItemRead, status_code=201)
async def create_item(item: ItemCreate, session: Session):
    return await ItemService(session).create(item)
