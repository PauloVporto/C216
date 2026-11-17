import os
from concurrent.futures import ThreadPoolExecutor

import pytest

from tests.integration.test_rentals_api import checkout, customer, game


@pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL", "").startswith("postgresql"),
    reason="Requires PostgreSQL row locks",
)
def test_concurrent_checkouts_do_not_oversell(client):
    b = game(client)
    customers = [customer(client, f"customer{i}@example.com") for i in range(2)]
    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(lambda r: checkout(client, b, r), customers))
    assert sorted(response.status_code for response in responses) == [201, 409]
    assert client.get("/api/games").json()[0]["available"] == 0
