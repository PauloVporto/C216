from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.middlewares.custom_header import add_custom_header
from app.middlewares.logging import log_requests
from app.routes import books, health, items, students

app = FastAPI(
    title="C216 Backend",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(books.router)

app.middleware("http")(log_requests)
app.middleware("http")(add_custom_header)
app.include_router(students.router)


app.include_router(items.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
