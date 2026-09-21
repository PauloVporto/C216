# C216

Backend FastAPI da disciplina C216, com Poetry, Docker Compose, testes automatizados e CI.

## Como executar os testes

Na raiz do repositório:

```bash
make install
make test
```

Separação pedida na prática:

```bash
make test-unit
make test-integration
```

Ou diretamente no backend:

```bash
cd backend
python -m poetry install
python -m poetry run pytest -v
python -m poetry run pytest tests/unit -v -m unit
python -m poetry run pytest tests/integration -v -m integration
```

O GitHub Actions executa os testes unitários e de integração em todo `push` e `pull_request` no workflow `.github/workflows/ci-backend.yml`.

## Docker

```bash
make build
make up
make health
```
