import asyncio
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from app.schemas.book import BookCreate
from app.services.book_service import BookService

@pytest.fixture
def conn(monkeypatch):
    mock = AsyncMock()
    @asynccontextmanager
    async def connection():
        yield mock
    monkeypatch.setattr("app.services.book_service.connection", connection)
    return mock

@pytest.mark.unit
def test_create_uses_parameters(conn):
    conn.fetchrow.return_value = dict(id=1, title="Livro", author="Autor", available=True)
    result = asyncio.run(BookService().create_book(BookCreate(title="Livro", author="Autor")))
    assert result.id == 1
    assert conn.fetchrow.call_args.args[1:] == ("Livro", "Autor", True)

@pytest.mark.unit
def test_missing_book_returns_404(conn):
    conn.fetchrow.return_value = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(BookService().get_book(99))
    assert exc.value.status_code == 404

@pytest.mark.unit
def test_missing_delete_returns_404(conn):
    conn.execute.return_value = "DELETE 0"
    with pytest.raises(HTTPException) as exc:
        asyncio.run(BookService().delete_book(99))
    assert exc.value.status_code == 404


@pytest.mark.unit
def test_list_filters_and_maps_rows(conn):
    conn.fetch.return_value = [dict(id=2, title="Livro", author="Autor", available=False)]
    result = asyncio.run(BookService().list_books(False))
    assert result[0].available is False
    assert conn.fetch.call_args.args[1:] == (False,)


@pytest.mark.unit
def test_replace_updates_all_fields(conn):
    from app.schemas.book import BookUpdate
    conn.fetchrow.return_value = dict(id=2, title="Novo", author="Outro", available=False)
    result = asyncio.run(BookService().replace_book(2, BookUpdate(title="Novo", author="Outro", available=False)))
    assert result.title == "Novo"
    assert conn.fetchrow.call_args.args[1:] == ("Novo", "Outro", False, 2)


@pytest.mark.unit
def test_patch_updates_only_sent_fields(conn):
    from app.schemas.book import BookPatch
    conn.fetchrow.return_value = dict(id=2, title="Original", author="Autor", available=False)
    result = asyncio.run(BookService().patch_book(2, BookPatch(available=False)))
    assert result.title == "Original"
    assert "SET available=$1" in conn.fetchrow.call_args.args[0]
    assert conn.fetchrow.call_args.args[1:] == (False, 2)


@pytest.mark.unit
def test_delete_existing_book(conn):
    conn.execute.return_value = "DELETE 1"
    assert asyncio.run(BookService().delete_book(2)) is None
    assert conn.execute.call_args.args[1:] == (2,)
