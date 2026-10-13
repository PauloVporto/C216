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

## Prática 5 — PostgreSQL e asyncpg

Livros (`/books`) e alunos (`/alunos`) são persistidos no PostgreSQL, com
rotas assíncronas, serviços, schemas e middlewares de logs e `X-App-Version`.
Alunos possuem `nome`, `curso` e `email`; `GET /alunos?curso=...` filtra por curso.
A API oferece listagem, busca por ID, criação, atualização e remoção.

```bash
docker compose up --build -d
docker compose run --build --rm tests
```

Os testes usam um PostgreSQL exclusivo (`db-test`), separado dos dados da API.
Para executar integração localmente, defina `TEST_DATABASE_URL` apontando para
um banco exclusivo de testes: as tabelas desse banco são limpas antes de cada teste.
Os testes unitários usam mocks e não precisam de banco.

O teste de alunos cadastra três alunos por curso em dois cursos, lista, busca,
atualiza, remove e verifica os dados em uma nova aplicação com novas conexões.
O volume `postgres_data` preserva os dados da API entre reinícios de containers.
`docker compose down` preserva esse volume; `make clean` o remove.

O SQL inicial usa `CREATE TABLE IF NOT EXISTS` para não apagar dados.
Em um volume criado nas práticas anteriores, aplique o schema uma vez:

```bash
docker compose exec -T db psql -U c216 -d c216 < backend/app/db/init.sql
```

### Evidências em `img/`

As capturas dos 29 testes aprovados, dos logs reais da API e da persistência
após reiniciar backend e PostgreSQL estão em [img/README.md](img/README.md).
A validação criou três alunos em cada um de dois cursos, listou, buscou por ID,
atualizou e removeu um aluno, confirmando os registros após o reinício.
