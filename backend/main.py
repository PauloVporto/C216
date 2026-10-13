from fastapi import FastAPI

from app.api.routers import books, health, students
from app.middlewares.logging import log_requests
from app.middlewares.custom_header import add_custom_header

app = FastAPI(
    title="C216 Backend",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(books.router)

app.middleware("http")(log_requests)
app.middleware("http")(add_custom_header)
app.include_router(students.router)
