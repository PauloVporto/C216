# C216

Aplicação full-stack da disciplina C216, com React, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Docker Compose,
Poetry, testes automatizados e integração contínua com GitHub Actions.

## Prática 5 — Persistência com PostgreSQL

A API de livros da prática anterior armazenava os registros em memória.
Nesta entrega, livros e alunos são gravados no PostgreSQL e recuperados por
consultas assíncronas com asyncpg. Os dados permanecem disponíveis após
reiniciar a aplicação e o banco.

O recurso de alunos foi adicionado para atender ao exercício: cadastrar pelo
menos três alunos por curso, listar, buscar por ID, atualizar e remover alunos.
A organização em camadas, os middlewares e os testes com TestClient foram mantidos.

## Estrutura do projeto

```text
C216/
├── backend/
│   ├── alembic/versions/007_create_items.py
│   ├── alembic.ini
│   ├── app/
│   │   ├── database/session.py  # sessão SQLAlchemy
│   │   ├── models/item.py       # model ORM
│   │   ├── repositories/item.py # consultas SQLAlchemy
│   │   ├── db/
│   │   │   ├── connection.py
│   │   │   └── init.sql
│   │   ├── middlewares/
│   │   │   ├── logging.py
│   │   │   └── custom_header.py
│   │   ├── routes/
│   │   │   ├── items.py
│   │   │   ├── books.py
│   │   │   ├── students.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── book_service.py
│   │   │   └── student_service.py
│   │   ├── schemas/
│   │   │   ├── book.py
│   │   │   └── student.py
│   │   └── main.py
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── conftest.py
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── pyproject.toml
│   └── poetry.lock
├── img/
├── docker-compose.yml
├── Makefile
└── .github/workflows/ci-backend.yml
```

O backend foi reorganizado conforme o modelo do README da prática:
rotas em `app/routes`, inicialização em `app/main.py`, dependências também
em `requirements.txt` e configuração do Pytest em `pytest.ini`.
O Docker Compose fica na raiz para coordenar os serviços do repositório.

| Camada ou arquivo | Responsabilidade |
|---|---|
| `routes` | Receber requisições HTTP e chamar os serviços |
| `schemas` | Validar os dados de entrada e definir as respostas com Pydantic |
| `services` | Executar as operações de livros e alunos com SQL parametrizado |
| `db/connection.py` | Abrir a conexão asyncpg e garantir seu fechamento |
| `db/init.sql` | Criar as tabelas de livros e alunos |
| `middlewares` | Registrar chamadas e adicionar o header de versão |
| `app/main.py` | Criar o FastAPI e registrar rotas e middlewares |

Poetry foi preservado para os comandos das práticas anteriores.
`requirements.txt` contém as versões do `poetry.lock`, incluindo dependências
de testes, e permite instalação com pip. Quando as dependências forem alteradas,
os dois arquivos devem continuar sincronizados.

## Executar com Docker Compose

Pré-requisito: Docker Desktop iniciado, com Docker Compose disponível.
Na raiz do repositório:

```bash
docker compose up --build -d
```

Ou usando o Makefile:

```bash
make build
make up
make health
```

- API: http://localhost:8000
- Documentação interativa: http://localhost:8000/docs
- Healthcheck: http://localhost:8000/health

| Serviço | Função |
|---|---|
| `api` | API FastAPI com Uvicorn na porta 8000 |
| `frontend` | React/Vite na porta 5173 |
| `db` | PostgreSQL 16 da API, com volume `postgres_data` |
| `tests` | Execução do Pytest no target de testes do Dockerfile |
| `db-test` | PostgreSQL exclusivo dos testes, com armazenamento temporário |

A API aguarda o healthcheck do banco antes de iniciar. Os serviços `tests` e
`db-test` pertencem ao perfil `test`; executar o serviço `tests` pelo Compose
inicia seu banco automaticamente.

O Dockerfile possui dois targets: `runtime`, com dependências da aplicação, e
`tests`, que também instala as dependências de desenvolvimento. A API inicia
com `uvicorn app.main:app`, usando o executável instalado no container.
Isso evita selecionar a `.venv` do computador ao montar `backend/` em `/app`.

### Inicialização do banco

`DATABASE_URL` define a conexão. No Compose, a API usa
`postgresql://c216:c216@db:5432/c216`. Na execução local, o padrão é
`postgresql://c216:c216@localhost:5432/c216`.

O script `app/db/init.sql` cria as tabelas com `CREATE TABLE IF NOT EXISTS`,
sem apagar registros existentes. Em um volume novo, o PostgreSQL executa esse
script automaticamente para livros e alunos; items é criado pelo Alembic na prática 7. Em volumes criados nas práticas anteriores, aplique-o
uma vez após iniciar o banco:

```bash
docker compose exec -T db psql -U c216 -d c216 < backend/app/db/init.sql
```

O volume `postgres_data` preserva os registros entre reinícios.
`docker compose down` preserva o volume; `make clean` remove containers e
volumes, apagando os dados desse banco.

## Endpoints

| Método | Rota | Operação |
|---|---|---|
| GET | `/books` | Listar livros; filtro opcional `available` |
| GET | `/books/{book_id}` | Buscar livro por ID |
| POST | `/books` | Criar livro |
| PUT | `/books/{book_id}` | Substituir os dados do livro |
| PATCH | `/books/{book_id}` | Atualizar os campos enviados |
| DELETE | `/books/{book_id}` | Remover livro |
| GET | `/alunos` | Listar alunos; filtro opcional `curso` |
| GET | `/alunos/{aluno_id}` | Buscar aluno por ID |
| POST | `/alunos` | Criar aluno |
| PUT | `/alunos/{aluno_id}` | Atualizar os dados do aluno |
| DELETE | `/alunos/{aluno_id}` | Remover aluno |

Livros possuem `title`, `author` e `available`; alunos possuem `nome`, `curso`
e `email`. O banco gera os IDs. Criações retornam 201, remoções retornam 204,
recursos inexistentes retornam 404 e dados inválidos retornam 422.

Exemplo de cadastro e listagem de alunos:

```bash
curl -X POST http://localhost:8000/alunos \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Paulo","curso":"C216","email":"paulo@example.com"}'

curl 'http://localhost:8000/alunos?curso=C216'
```

### Middlewares

`logging.py` registra método HTTP, caminho, status da resposta e duração da
chamada nos logs do container. `custom_header.py` adiciona
`X-App-Version: 1.0` às respostas.

```bash
docker compose logs api
```

## Testes automatizados

### Suíte completa com PostgreSQL no Docker

Na raiz do repositório:

```bash
docker compose run --build --rm tests
```

Ou:

```bash
make test-docker
```

Os testes de integração usam TestClient e o serviço `db-test`, separado do
banco da API. A fixture cria o schema e limpa as tabelas antes de cada teste.
Os testes unitários usam mocks e não precisam de PostgreSQL.

### Execução local com Poetry

Com Python 3.11 ou superior e Poetry instalados:

```bash
make install
make test-unit
```

Para executar integração localmente, crie um banco exclusivo de testes e
configure sua conexão. Exemplo para um PostgreSQL acessível em localhost:

```bash
export TEST_DATABASE_URL='postgresql://c216:c216@localhost:5432/c216_test'
make test-integration
make test
```

O banco `c216_test` precisa existir. As tabelas de livros e alunos desse banco
serão limpas antes de cada teste; use uma conexão exclusiva de testes.

### Instalação alternativa com pip

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pytest tests/unit -v -m unit
```

Com `TEST_DATABASE_URL` configurada para um banco de testes existente,
`python -m pytest -v` executa a suíte completa. A configuração e os marcadores
`unit` e `integration` ficam em `backend/pytest.ini`.

## Validação da entrega

A suíte completa passou no Docker: **29 testes aprovados**, sendo 7 unitários
e 22 de integração. Após reorganizar os arquivos conforme o modelo da prática,
os testes foram executados novamente e a API iniciou com `app.main:app`.

O teste de alunos cadastra três alunos em cada um de dois cursos, verifica
listagem e filtro por curso, busca por ID, atualização e remoção. Também
recupera os dados por uma nova aplicação com novas conexões ao banco.

Além dos testes automatizados, a validação real pela API criou seis alunos,
atualizou um deles e executou:

```bash
docker compose restart api db
```

Após o reinício, os seis registros foram consultados com os mesmos IDs e dados,
inclusive a atualização. A remoção retornou 204 e a consulta posterior do aluno
removido retornou 404, confirmando CRUD e persistência.

### Evidências em `img/`

- [Resultado dos testes](img/testes.png).
- [Logs do container com chamadas à API](img/logs-api.png).
- [Persistência após reiniciar API e banco](img/persistencia.png).

O [relatório de evidências](img/README.md) apresenta as capturas e o contexto
da validação. As saídas em texto também estão disponíveis nessa pasta.

## CI com GitHub Actions

O workflow `.github/workflows/ci-backend.yml` executa em `push` e `pull_request`.
Ele configura Python 3.12, instala as dependências com Poetry e executa as
suítes unitária e de integração em etapas separadas. Um serviço PostgreSQL
fornece o banco exclusivo usado pelos testes de integração.

## Atendimento ao exercício

| Requisito da Prática 5 | Implementação e evidência |
|---|---|
| Adaptar a API para PostgreSQL | Livros e alunos persistidos com asyncpg |
| Criar testes automatizados de API | TestClient, fixture e testes de integração |
| Adicionar três alunos por curso e testar CRUD | Teste com dois cursos, listagem, busca, atualização e remoção |
| Validar persistência dos dados | Teste com novas conexões e validação após reiniciar containers |
| Salvar prints em `img/` | Capturas dos testes, logs da API e persistência |

## Prática 7 — Integração Full-stack: CORS, E2E e Multicontêiner

O React agora consome FastAPI e PostgreSQL. O cadastro faz POST `/items/`,
recebe o ID do banco e atualiza a lista. Ao recarregar, o GET `/items/`
recupera os mesmos dados persistidos. As rotas de livros e alunos continuam disponíveis.

### Executar

Requisitos: Docker Compose, Python 3.11+, Poetry, Node.js 22.22.2+ e npm para os testes locais.

```bash
cp .env.example .env
make up-build
make db-upgrade
make db-current
make ps
```

Interface: http://localhost:5173. Swagger: http://localhost:8000/docs.
Todos os três serviços devem aparecer saudáveis. Após modificar código,
execute `make up-build`, pois os arquivos são copiados para as imagens.
`make down` encerra os serviços preservando o volume de desenvolvimento.

### Contrato e organização

- `GET /items/`: 200 com lista de `{id, name, description}`.
- `POST /items/`: 201; nome obrigatório de 1 a 100 caracteres após trim,
  descrição opcional. Nome duplicado retorna 409 com a mensagem
  "Já existe um item com esse nome"; corpo inválido retorna 422.
- `frontend/src/services/items.js` centraliza fetch e usa `VITE_API_URL`.
  Falhas de rede e respostas HTTP de erro viram mensagens acessíveis.
- App mostra carregamento e erro de listagem. ItemForm aguarda o cadastro,
  desabilita o botão durante o envio, limpa somente no sucesso e mantém campos no erro.
- Backend: route → service → repository → PostgreSQL. A restrição UNIQUE
  garante nomes únicos inclusive em requisições concorrentes.
- SQLAlchemy faz o INSERT e a consulta de items, com model em `app/models/item.py`,
  sessão em `app/database/session.py` e repository em `app/repositories/item.py`.
- Alembic gerencia a criação da tabela: `make db-upgrade` executa `alembic upgrade head`;
  `make db-current` executa `alembic current` e mostra `007_items (head)`.
  A migração também preserva registros de volumes da versão anterior da prática 7.
- Em banco vazio, é necessário aplicar a migração antes de cadastrar/listar items.
  Livros e alunos mantêm a persistência asyncpg das práticas anteriores.

### CORS e rede Docker

`CORS_ORIGINS` recebe origens explícitas separadas por vírgulas, por padrão
http://localhost:5173 e http://127.0.0.1:5173. O middleware permite GET, POST
e Content-Type, sem credenciais. O navegador faz preflight OPTIONS antes do POST JSON.
CORS é uma regra do navegador e não substitui autenticação.

O React executa no navegador: `VITE_API_URL` aponta para `http://localhost:8000`,
não para o nome Docker `api`. Dentro do backend, PostgreSQL é acessado
por `db:5432`. Variáveis VITE são públicas e não devem conter senhas.
Se alterar as portas, ajuste também VITE_API_URL e CORS_ORIGINS no `.env`.
Use a barra final `/items/` para evitar redirecionamentos 307.

### Testes e CI

```bash
make install
make frontend-install
cd frontend
npx playwright install chromium
cd ..
make check-all
```

`make lint` executa Ruff; `make format` formata Python com Ruff.
`make check-all` verifica lint e formatação Ruff, Biome, os testes Vitest, o build Vite, toda a suíte
backend com PostgreSQL exclusivo e os testes E2E reais. `make test-docker`
executa apenas o backend; `make frontend-test` executa Vitest.

`make e2e` sobe o projeto Compose `lab-e2e`, com API 8001, frontend 5174,
volume PostgreSQL exclusivo, aplica migrações e roda Playwright sem mocks.
Ao terminar, inclusive em falha, remove os serviços e o volume desse projeto.
O volume de desenvolvimento pertence a outro projeto e é preservado.
`make frontend-test-e2e` apenas executa Playwright contra uma stack já ativa
(`E2E_BASE_URL`, padrão http://localhost:5173).

Vitest cobre carregamento, estado vazio, dados da API, validação, envio JSON,
erro de conexão e conflito 409. O backend testa CORS permitido/desconhecido,
contrato, duplicidade e validação de items com SQLite em memória, além de migrações
Alembic e dos testes existentes de livros/alunos com PostgreSQL. E2E comprova cadastro, preflight OPTIONS e resposta com header
CORS, persistência após reload, conflito e layout mobile. Nomes únicos permitem
execução sem depender de registros prévios. A CI frontend executa `make e2e`
e publica o relatório Playwright. As evidências estão em [img/pratica-7](img/pratica-7/README.md).

### Checklist

- [x] Cliente HTTP com listItems e createItem usando fetch.
- [x] Interface integrada à API com carregamento e erros.
- [x] CORS com origens explícitas configuráveis.
- [x] Dockerfile frontend e Compose com três serviços saudáveis.
- [x] Testes unitários e de integração com fetch mockado.
- [x] E2E real comprovando persistência após reload.
- [x] Model e repository SQLAlchemy, migrações Alembic e versão `(head)`.
- [x] Ruff pelos comandos lint e format; check-all verifica ambos.
- [x] Comando check-all incluindo backend e E2E isolado.

Instruções resumidas de Docker estão em [README-docker.md](README-docker.md).

O histórico e as capturas da prática 6 continuam em [img/pratica-6](img/pratica-6/README.md).
