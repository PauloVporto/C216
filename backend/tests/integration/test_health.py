import pytest


@pytest.mark.integration
def test_root_returns_success(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Backend C216 funcionando"


@pytest.mark.integration
def test_health_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.integration
@pytest.mark.parametrize(
    "path, expected_status",
    [
        ("/", 200),
        ("/health", 200),
        ("/docs", 200),
        ("/openapi.json", 200),
    ],
)
def test_public_routes_status_code(client, path, expected_status):
    response = client.get(path)

    assert response.status_code == expected_status


@pytest.mark.integration
def test_unknown_route_returns_not_found(client):
    response = client.get("/rota-inexistente")

    assert response.status_code == 404
    assert "detail" in response.json()


@pytest.mark.integration
def test_health_does_not_accept_post(client):
    response = client.post("/health")

    assert response.status_code == 405
    assert "detail" in response.json()
