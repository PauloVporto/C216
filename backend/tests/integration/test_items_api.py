import pytest

pytestmark = pytest.mark.integration

def test_items_persist_and_conflict(client):
    assert client.get("/items/").json() == []
    response = client.post("/items/", json={"name": " Notebook ", "description": "14 polegadas"})
    assert response.status_code == 201
    item = response.json()
    assert item["name"] == "Notebook"
    assert client.get("/items/").json() == [item]
    duplicate = client.post("/items/", json={"name": "Notebook"})
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Já existe um item com esse nome"

@pytest.mark.parametrize("name", ["", "   ", "a" * 101])
def test_invalid_name(client, name):
    assert client.post("/items/", json={"name": name}).status_code == 422
