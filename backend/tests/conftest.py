import pytest
from fastapi.testclient import TestClient

from app.services.book_service import book_service
from main import app


@pytest.fixture
def client():
    book_service.clear()
    return TestClient(app)


@pytest.fixture
def service():
    book_service.clear()
    return book_service
