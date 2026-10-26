# C216

Backend FastAPI da disciplina C216, com PostgreSQL, asyncpg, Docker Compose,
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
│   ├── app/
│   │   ├── db/
│   │   │   ├── connection.py
│   │   │   └── init.sql
│   │   ├── middlewares/
│   │   │   ├── logging.py
│   │   │   └── custom_header.py
│   │   ├── routes/
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
| `backend` | API FastAPI com Uvicorn na porta 8000 |
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
script automaticamente. Em volumes criados nas práticas anteriores, aplique-o
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
docker compose logs backend
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
docker compose restart backend db
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

## Prática 6 — Frontend com React

O diretório `frontend/` contém um projeto independente em JavaScript, com
React, Vite, Tailwind CSS v4, Biome, Vitest, React Testing Library e Playwright.
O backend e o Docker Compose da prática 5 permanecem como entregues.

### Executar

Requisito: Node.js 22 LTS atualizado (22.22.2 ou superior) e npm.

```bash
cd frontend
npm ci
npm run dev
```

Abra http://localhost:5173. Informe um nome obrigatório de até 100 caracteres
e, opcionalmente, uma descrição. Ao adicionar, o item aparece na listagem e
os campos são limpos. Espaços nas extremidades são removidos; entradas
inválidas exibem mensagens associadas ao campo. A interface adapta-se ao celular.
Os dados ficam somente no estado React e desaparecem ao recarregar a página.
Não há chamadas à API nem persistência em localStorage.

### Organização

```text
frontend/
├── src/
│   ├── components/ItemForm.jsx  # formulário e mensagens de erro
│   ├── components/ItemList.jsx  # listagem e estado vazio
│   ├── App.jsx                 # estado e composição dos componentes
│   ├── validation.js           # função pura de validação
│   ├── main.jsx
│   └── index.css               # importação do Tailwind v4
├── tests/
│   ├── setup.js
│   ├── unit/                   # validação e componentes isolados
│   ├── integration/            # cadastro integrado à listagem
│   └── e2e/                    # navegação real com Chromium
├── biome.json
├── vite.config.js
├── playwright.config.js
└── package-lock.json
```

`App` guarda os itens com `useState`, envia `onAdd` ao formulário e `items`
à lista. Cada item recebe `crypto.randomUUID()` para uma `key` estável.
A função `addItem` concentra a futura integração HTTP da prática 7.

### Qualidade e testes

```bash
cd frontend
npm ci
npx playwright install chromium
npm run lint
npm run format:check
npm run check
npm test
npm run build
npm run test:e2e
```

Para formatar, use `npm run format`; para acompanhar testes, `npm run test:watch`.
Na raiz, `make frontend-install`, `make frontend-dev`, `make frontend-test`,
`make frontend-build` e `make frontend-e2e` oferecem os mesmos comandos.
`make check-all` executa o checklist de qualidade, testes e build do frontend
(após instalar dependências e Chromium); os comandos existentes do backend continuam disponíveis.

O Vitest executa somente `tests/unit` e `tests/integration`, usando jsdom e
limpeza do DOM após cada teste. O Playwright inicia o Vite automaticamente
na porta 5173 e executa `tests/e2e` no Chromium. Os cenários verificam cadastro,
validação, descrição opcional, limpeza dos campos, múltiplos itens, ausência de
requisições fetch/XHR, perda do estado ao recarregar e layout em 375 pixels.

### CI e entrega

O workflow `.github/workflows/ci-frontend.yml` usa Node.js 22 e `npm ci`,
verifica lint, formatação e imports, executa Vitest, build e Playwright,
e disponibiliza o relatório E2E como artefato. Os dois workflows usam `paths`
para disparar conforme os arquivos de frontend ou backend modificados.
Checks obrigatórios com filtros podem ficar pendentes quando o workflow não dispara.

As evidências da prática 6 estão em [img/pratica-6/](img/pratica-6/README.md).
A containerização do frontend e a integração full-stack ficam para a prática 7.

| Requisito da Prática 6 | Implementação |
|---|---|
| Cadastro e listagem em memória | App, ItemForm e ItemList |
| Nome obrigatório, máximo 100 caracteres | validateItem e mensagens acessíveis |
| Descrição opcional | Textarea e listagem condicional |
| Interface responsiva | Classes Tailwind v4 e teste de celular |
| Lint e formatação | Biome, sem ESLint ou Prettier |
| Testes em três níveis | Vitest + RTL e Playwright/Chromium |
| CI e lockfile | ci-frontend.yml e package-lock.json versionado |
| Sem chamadas ao backend | Estado local e verificação E2E de fetch/XHR |
