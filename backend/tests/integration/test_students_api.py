import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.mark.integration
def test_students_crud_and_persistence(client):
    created = []
    for curso in ("Engenharia de Software", "Engenharia de Computação"):
        for i in range(3):
            response = client.post("/alunos", json=dict(nome=f"Aluno {i}", curso=curso, email=f"aluno{i}@example.com"))
            assert response.status_code == 201
            created.append(response.json())
        response = client.get("/alunos", params={"curso": curso})
        assert response.status_code == 200
        assert len(response.json()) == 3
    assert len(client.get("/alunos").json()) == 6
    aluno = created[0]
    assert client.get(f"/alunos/{aluno['id']}").json() == aluno
    payload = dict(nome="Aluno atualizado", curso=aluno["curso"], email="novo@example.com")
    response = client.put(f"/alunos/{aluno['id']}", json=payload)
    assert response.status_code == 200
    assert response.json() == dict(id=aluno["id"], **payload)
    # Uma nova aplicação e novas conexões recuperam os dados gravados.
    from fastapi import FastAPI
    from app.api.routers.students import router
    restarted_app = FastAPI()
    restarted_app.include_router(router)
    with TestClient(restarted_app) as restarted:
        assert restarted.get(f"/alunos/{aluno['id']}").json() == response.json()
        assert len(restarted.get("/alunos").json()) == 6
    assert client.delete(f"/alunos/{aluno['id']}").status_code == 204
    assert client.get(f"/alunos/{aluno['id']}").status_code == 404
    assert len(client.get("/alunos").json()) == 5

@pytest.mark.integration
@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_missing_student(client, method):
    kwargs = {"json": dict(nome="Aluno", curso="C216", email="a@example.com")} if method == "put" else {}
    assert getattr(client, method)("/alunos/999", **kwargs).status_code == 404

@pytest.mark.integration
def test_validation_and_header(client):
    assert client.post("/alunos", json=dict(nome="", curso="C216", email="a")).status_code == 422
    assert client.get("/health").headers["X-App-Version"] == "1.0"
    assert client.patch("/books/1", json={"title": None}).status_code == 422
