from fastapi import APIRouter
from app.schemas.item import ItemCreate, ItemRead
from app.services.item import ItemService

router = APIRouter(prefix="/items", tags=["items"])
service = ItemService()

@router.get("/", response_model=list[ItemRead])
async def list_items():
    return await service.list()

@router.post("/", response_model=ItemRead, status_code=201)
async def create_item(item: ItemCreate):
    return await service.create(item)
