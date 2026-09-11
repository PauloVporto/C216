# C216

Backend FastAPI da disciplina C216, com Poetry, Docker Compose e testes automatizados.

## Como executar os testes

Na raiz do repositório:

```bash
make install
make test
```

Ou diretamente no backend:

```bash
cd backend
python -m poetry install
python -m poetry run pytest -v
```

O GitHub Actions executa o mesmo Pytest em todo `push` e `pull_request` no workflow `.github/workflows/ci-backend.yml`.

## Docker

```bash
make build
make up
make health
```
