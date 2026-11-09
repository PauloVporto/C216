from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def root():
    return {"message": "Backend C216 funcionando"}


@router.get("/health")
def health():
    return {"status": "ok"}
