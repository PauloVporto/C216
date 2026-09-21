from fastapi import FastAPI

from app.api.routers import books, health

app = FastAPI(
    title="C216 Backend",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(books.router)
