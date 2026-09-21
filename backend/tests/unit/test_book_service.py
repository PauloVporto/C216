import pytest
from fastapi import HTTPException

from app.schemas.book import BookCreate, BookPatch, BookUpdate


@pytest.mark.unit
def test_create_book_assigns_incremental_id(service):
    first = service.create_book(BookCreate(title="Dom Casmurro", author="Machado de Assis"))
    second = service.create_book(BookCreate(title="Memórias Póstumas", author="Machado de Assis"))

    assert first.id == 1
    assert second.id == 2
    assert first.title == "Dom Casmurro"


@pytest.mark.unit
def test_list_books_filters_by_availability(service):
    service.create_book(BookCreate(title="Livro A", author="Autor A", available=True))
    service.create_book(BookCreate(title="Livro B", author="Autor B", available=False))

    available_books = service.list_books(available=True)
    unavailable_books = service.list_books(available=False)

    assert len(available_books) == 1
    assert available_books[0].title == "Livro A"
    assert len(unavailable_books) == 1
    assert unavailable_books[0].title == "Livro B"


@pytest.mark.unit
def test_get_book_raises_not_found(service):
    with pytest.raises(HTTPException) as exc:
        service.get_book(99)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Livro não encontrado"


@pytest.mark.unit
def test_replace_book_overwrites_all_fields(service):
    created = service.create_book(BookCreate(title="Antigo", author="Autor", available=True))

    updated = service.replace_book(
        created.id,
        BookUpdate(title="Novo", author="Outro autor", available=False),
    )

    assert updated.title == "Novo"
    assert updated.author == "Outro autor"
    assert updated.available is False


@pytest.mark.unit
def test_patch_book_updates_only_sent_fields(service):
    created = service.create_book(BookCreate(title="Título", author="Autor", available=True))

    patched = service.patch_book(created.id, BookPatch(available=False))

    assert patched.title == "Título"
    assert patched.author == "Autor"
    assert patched.available is False


@pytest.mark.unit
def test_delete_book_removes_resource(service):
    created = service.create_book(BookCreate(title="Apagar", author="Autor"))

    service.delete_book(created.id)

    with pytest.raises(HTTPException) as exc:
        service.get_book(created.id)

    assert exc.value.status_code == 404
