import pytest

BOOK_PAYLOAD = {
    "title": "O Alienista",
    "author": "Machado de Assis",
    "available": True,
}


@pytest.mark.integration
def test_create_book_returns_created(client):
    response = client.post("/books", json=BOOK_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] == 1
    assert body["title"] == BOOK_PAYLOAD["title"]
    assert body["author"] == BOOK_PAYLOAD["author"]
    assert body["available"] is True


@pytest.mark.integration
def test_list_books_returns_collection(client):
    client.post("/books", json=BOOK_PAYLOAD)

    response = client.get("/books")

    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.integration
def test_list_books_filters_by_query_parameter(client):
    client.post("/books", json=BOOK_PAYLOAD)
    client.post(
        "/books",
        json={"title": "Indisponível", "author": "Autor", "available": False},
    )

    response = client.get("/books", params={"available": True})

    assert response.status_code == 200
    books = response.json()
    assert len(books) == 1
    assert books[0]["title"] == BOOK_PAYLOAD["title"]


@pytest.mark.integration
def test_get_book_by_path_parameter(client):
    created = client.post("/books", json=BOOK_PAYLOAD).json()

    response = client.get(f"/books/{created['id']}")

    assert response.status_code == 200
    assert response.json()["title"] == BOOK_PAYLOAD["title"]


@pytest.mark.integration
def test_get_book_returns_not_found(client):
    response = client.get("/books/99")

    assert response.status_code == 404
    assert response.json()["detail"] == "Livro não encontrado"


@pytest.mark.integration
def test_put_book_replaces_resource(client):
    created = client.post("/books", json=BOOK_PAYLOAD).json()
    payload = {
        "title": "Quincas Borba",
        "author": "Machado de Assis",
        "available": False,
    }

    response = client.put(f"/books/{created['id']}", json=payload)

    assert response.status_code == 200
    assert response.json() == {"id": created["id"], **payload}


@pytest.mark.integration
def test_patch_book_updates_partial_fields(client):
    created = client.post("/books", json=BOOK_PAYLOAD).json()

    response = client.patch(f"/books/{created['id']}", json={"available": False})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == BOOK_PAYLOAD["title"]
    assert body["available"] is False


@pytest.mark.integration
def test_delete_book_removes_resource(client):
    created = client.post("/books", json=BOOK_PAYLOAD).json()

    delete_response = client.delete(f"/books/{created['id']}")
    get_response = client.get(f"/books/{created['id']}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


@pytest.mark.integration
def test_create_book_validates_payload(client):
    response = client.post("/books", json={"title": "", "author": "Autor"})

    assert response.status_code == 422
