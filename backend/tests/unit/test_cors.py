import pytest
from fastapi.testclient import TestClient
from app.main import app

pytestmark = pytest.mark.unit

@pytest.mark.parametrize("origin,allowed", [("http://localhost:5173", True), ("https://unknown.example", False)])
def test_cors_preflight(origin, allowed):
    with TestClient(app) as client:
        response = client.options("/items/", headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type"})
    assert response.status_code == (200 if allowed else 400)
    assert response.headers.get("access-control-allow-origin") == (origin if allowed else None)
