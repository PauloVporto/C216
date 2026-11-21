from datetime import timedelta

from app.services.rentals import business_today


def game(client, **overrides):
    response = client.post(
        "/api/games",
        json={
            "title": "Astro Bot",
            "platform": "PS5",
            "genre": "Aventura",
            "daily_rate_cents": 1500,
            "copies": 1,
            **overrides,
        },
    )
    assert response.status_code == 201
    return response.json()


def customer(client, email="ana@example.com"):
    response = client.post("/api/customers", json={"name": "Ana", "email": email})
    assert response.status_code == 201
    return response.json()


def checkout(client, b, r, **overrides):
    return client.post(
        "/api/rentals",
        json={
            "game_id": b["id"],
            "customer_id": r["id"],
            "due_date": str(business_today() + timedelta(days=7)),
            **overrides,
        },
    )


def test_complete_game_crud_and_persistence(client):
    b = game(client)
    assert client.get("/api/games").json()[0]["title"] == "Astro Bot"
    update = {
        key: b[key]
        for key in ("title", "platform", "genre", "daily_rate_cents", "copies")
    }
    update["title"] = "Sackboy"
    assert client.put(f"/api/games/{b['id']}", json=update).status_code == 200
    assert client.get("/api/games").json()[0]["title"] == "Sackboy"
    assert client.delete(f"/api/games/{b['id']}").status_code == 204
    assert client.get("/api/games").json() == []


def test_checkout_return_and_history(client):
    b, r = game(client), customer(client)
    rental = checkout(client, b, r)
    assert rental.status_code == 201
    rental_id = rental.json()["id"]
    assert client.get("/api/games").json()[0]["available"] == 0
    assert checkout(client, b, r).status_code == 409
    assert checkout(client, b, customer(client, "other@example.com")).status_code == 409
    assert client.delete(f"/api/games/{b['id']}").status_code == 409
    assert client.delete(f"/api/customers/{r['id']}").status_code == 409
    assert (
        client.post(f"/api/rentals/{rental_id}/return").json()["status"] == "returned"
    )
    assert client.post(f"/api/rentals/{rental_id}/return").status_code == 409
    assert client.get("/api/games").json()[0]["available"] == 1
    assert checkout(client, b, r).status_code == 201
    assert len(client.get("/api/rentals").json()) == 2


def test_stock_and_validation(client):
    b, r = game(client, copies=2), customer(client)
    assert checkout(client, b, r).status_code == 201
    assert checkout(client, b, customer(client, "b@example.com")).status_code == 201
    data = {
        key: b[key]
        for key in ("title", "platform", "genre", "daily_rate_cents", "copies")
    }
    data["copies"] = 1
    assert client.put(f"/api/games/{b['id']}", json=data).status_code == 409
    assert (
        checkout(
            client, b, r, due_date=str(business_today() - timedelta(days=1))
        ).status_code
        == 422
    )
    assert client.post("/api/games", json={**data, "title": "   "}).status_code == 422
    assert client.post("/api/games", json={**data, "copies": 0}).status_code == 422
    assert (
        client.post(
            "/api/customers", json={"name": "Ana", "email": "invalid"}
        ).status_code
        == 422
    )
    assert client.delete("/api/games/999999").status_code == 404
    assert client.post("/api/rentals/999999/return").status_code == 404


def test_customer_crud_and_duplicate_email(client):
    r = customer(client)
    assert (
        client.post(
            "/api/customers", json={"name": "Outra", "email": "ANA@example.com"}
        ).status_code
        == 409
    )
    assert (
        client.put(
            f"/api/customers/{r['id']}",
            json={"name": "Ana Silva", "email": "ana@example.com"},
        ).status_code
        == 200
    )
    assert client.get("/api/customers").json()[0]["name"] == "Ana Silva"
    assert client.delete(f"/api/customers/{r['id']}").status_code == 204
    assert client.get("/api/customers").json() == []


def test_health_and_cors(client):
    assert client.get("/health").json() == {"status": "ok"}
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "DELETE",
    }
    response = client.options("/api/games/1", headers=headers)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == headers["Origin"]
    headers["Origin"] = "https://untrusted.example"
    assert client.options("/api/games/1", headers=headers).status_code == 400


def test_price_snapshot_survives_catalog_changes_and_return(client):
    g, c = game(client, daily_rate_cents=1250), customer(client)
    rental = checkout(client, g, c).json()
    assert rental["estimated_total_cents"] == 8750
    assert rental["total_cents"] == 8750
    update = {
        key: g[key]
        for key in ("title", "platform", "genre", "copies", "daily_rate_cents")
    }
    update["daily_rate_cents"] = 9900
    assert client.put(f"/api/games/{g['id']}", json=update).status_code == 200
    returned = client.post(f"/api/rentals/{rental['id']}/return").json()
    assert returned["daily_rate_cents"] == 1250
    assert returned["total_cents"] == 8750
    assert returned["billable_days"] == 7
    assert returned["status"] == "returned"
    assert client.get("/api/rentals").json()[0]["total_cents"] == 8750
    assert client.delete(f"/api/games/{g['id']}").status_code == 409


def test_game_specific_validation(client):
    g = game(client)
    data = {
        key: g[key]
        for key in ("title", "platform", "genre", "copies", "daily_rate_cents")
    }
    for override in [
        {"platform": "unknown"},
        {"daily_rate_cents": 0},
        {"daily_rate_cents": 12.5},
    ]:
        assert client.post("/api/games", json={**data, **override}).status_code == 422


def test_late_return_closes_bill_and_keeps_final_total(client, monkeypatch):
    from datetime import date, datetime

    from app.services import rentals as service

    monkeypatch.setattr(service, "business_today", lambda: date(2026, 11, 17))
    g, c = game(client, daily_rate_cents=1299), customer(client)
    rental = checkout(client, g, c, due_date="2026-11-20").json()
    assert rental["estimated_total_cents"] == 3897
    monkeypatch.setattr(service, "business_today", lambda: date(2026, 11, 22))
    overdue = client.get("/api/rentals").json()[0]
    assert overdue["status"] == "overdue"
    assert overdue["late_days"] == 2
    assert overdue["total_cents"] == 6495

    class ReturnDate(datetime):
        @classmethod
        def now(cls, tz=None):
            return cls(2026, 11, 22, 15, tzinfo=tz)

    monkeypatch.setattr(service, "datetime", ReturnDate)
    returned = client.post(f"/api/rentals/{rental['id']}/return").json()
    assert returned["status"] == "returned"
    assert returned["total_cents"] == 6495
    assert returned["billable_days"] == 5
    monkeypatch.setattr(service, "business_today", lambda: date(2026, 12, 1))
    assert client.get("/api/rentals").json()[0]["total_cents"] == 6495
