from datetime import date, timedelta


def book(client, **overrides):
    response = client.post(
        "/api/books",
        json={
            "title": "Dom Casmurro",
            "author": "Machado de Assis",
            "category": "Literatura",
            "copies": 1,
            **overrides,
        },
    )
    assert response.status_code == 201
    return response.json()


def reader(client, email="ana@example.com"):
    response = client.post("/api/readers", json={"name": "Ana", "email": email})
    assert response.status_code == 201
    return response.json()


def checkout(client, b, r, **overrides):
    return client.post(
        "/api/loans",
        json={
            "book_id": b["id"],
            "reader_id": r["id"],
            "due_date": str(date.today() + timedelta(days=7)),
            **overrides,
        },
    )


def test_complete_book_crud_and_persistence(client):
    b = book(client)
    assert client.get("/api/books").json()[0]["title"] == "Dom Casmurro"
    update = {key: b[key] for key in ("title", "author", "category", "copies")}
    update["title"] = "Memórias Póstumas"
    assert client.put(f"/api/books/{b['id']}", json=update).status_code == 200
    assert client.get("/api/books").json()[0]["title"] == "Memórias Póstumas"
    assert client.delete(f"/api/books/{b['id']}").status_code == 204
    assert client.get("/api/books").json() == []


def test_checkout_return_and_history(client):
    b, r = book(client), reader(client)
    loan = checkout(client, b, r)
    assert loan.status_code == 201
    loan_id = loan.json()["id"]
    assert client.get("/api/books").json()[0]["available"] == 0
    assert checkout(client, b, r).status_code == 409
    assert checkout(client, b, reader(client, "other@example.com")).status_code == 409
    assert client.delete(f"/api/books/{b['id']}").status_code == 409
    assert client.delete(f"/api/readers/{r['id']}").status_code == 409
    assert client.post(f"/api/loans/{loan_id}/return").json()["status"] == "returned"
    assert client.post(f"/api/loans/{loan_id}/return").status_code == 409
    assert client.get("/api/books").json()[0]["available"] == 1
    assert checkout(client, b, r).status_code == 201
    assert len(client.get("/api/loans").json()) == 2


def test_stock_and_validation(client):
    b, r = book(client, copies=2), reader(client)
    assert checkout(client, b, r).status_code == 201
    assert checkout(client, b, reader(client, "b@example.com")).status_code == 201
    data = {key: b[key] for key in ("title", "author", "category", "copies")}
    data["copies"] = 1
    assert client.put(f"/api/books/{b['id']}", json=data).status_code == 409
    assert (
        checkout(
            client, b, r, due_date=str(date.today() - timedelta(days=1))
        ).status_code
        == 422
    )
    assert client.post("/api/books", json={**data, "title": "   "}).status_code == 422
    assert client.post("/api/books", json={**data, "copies": 0}).status_code == 422
    assert (
        client.post(
            "/api/readers", json={"name": "Ana", "email": "invalid"}
        ).status_code
        == 422
    )
    assert client.delete("/api/books/999999").status_code == 404
    assert client.post("/api/loans/999999/return").status_code == 404


def test_reader_crud_and_duplicate_email(client):
    r = reader(client)
    assert (
        client.post(
            "/api/readers", json={"name": "Outra", "email": "ANA@example.com"}
        ).status_code
        == 409
    )
    assert (
        client.put(
            f"/api/readers/{r['id']}",
            json={"name": "Ana Silva", "email": "ana@example.com"},
        ).status_code
        == 200
    )
    assert client.get("/api/readers").json()[0]["name"] == "Ana Silva"
    assert client.delete(f"/api/readers/{r['id']}").status_code == 204
    assert client.get("/api/readers").json() == []


def test_health_and_cors(client):
    assert client.get("/health").json() == {"status": "ok"}
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "DELETE",
    }
    response = client.options("/api/books/1", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == headers["Origin"]
    headers["Origin"] = "https://untrusted.example"
    assert client.options("/api/books/1", headers=headers).status_code == 400
