import pytest

pytestmark = pytest.mark.integration


def test_items_persist_and_conflict(items_client):
    assert items_client.get("/items/").json() == []
    response = items_client.post(
        "/items/", json={"name": " Notebook ", "description": "14 polegadas"}
    )
    assert response.status_code == 201
    item = response.json()
    assert item["name"] == "Notebook"
    assert items_client.get("/items/").json() == [item]
    duplicate = items_client.post("/items/", json={"name": "Notebook"})
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Já existe um item com esse nome"


@pytest.mark.parametrize("name", ["", "   ", "a" * 101])
def test_invalid_name(items_client, name):
    assert items_client.post("/items/", json={"name": name}).status_code == 422


def test_maximum_name_and_optional_description(items_client):
    response = items_client.post("/items/", json={"name": "a" * 100})
    assert response.status_code == 201
    assert response.json()["description"] is None


def test_can_create_after_duplicate_error(items_client):
    assert items_client.post("/items/", json={"name": "Duplicado"}).status_code == 201
    assert items_client.post("/items/", json={"name": "Duplicado"}).status_code == 409
    assert items_client.post("/items/", json={"name": "Novo"}).status_code == 201
    assert len(items_client.get("/items/").json()) == 2
