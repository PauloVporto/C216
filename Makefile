SHELL := /bin/bash
POETRY ?= poetry
COMPOSE ?= docker compose
.DEFAULT_GOAL := help
.PHONY: help install up down logs status migrate test test-backend test-frontend lint format check e2e db-shell
help:
	@echo 'install: dependências locais | up/down: iniciar/parar Docker | logs/status: diagnóstico'
	@echo 'test: Pytest/PostgreSQL + Vitest | lint/format: Ruff e Biome | check: lint + testes + build'
	@echo 'migrate: Alembic upgrade head | e2e: fluxo real isolado | db-shell: psql'
install:
	cd backend && $(POETRY) install --no-root
	cd frontend && npm ci
up:
	$(COMPOSE) up -d --build --wait
down:
	$(COMPOSE) down
logs:
	$(COMPOSE) logs -f
status:
	$(COMPOSE) ps
migrate:
	$(COMPOSE) exec api alembic upgrade head
db-shell:
	$(COMPOSE) exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
test: test-backend test-frontend
test-backend:
	$(COMPOSE) --profile test build tests
	$(COMPOSE) --profile test run --rm tests
test-frontend:
	cd frontend && npm test
lint:
	cd backend && $(POETRY) run ruff check . && $(POETRY) run ruff format --check .
	cd frontend && npm run check
format:
	cd backend && $(POETRY) run ruff check --fix . && $(POETRY) run ruff format .
	cd frontend && npx biome check --write .
check: lint test
	cd frontend && npm run build
e2e:
	./scripts/e2e.sh
