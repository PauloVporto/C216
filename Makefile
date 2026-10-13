.PHONY: help install run test test-unit test-integration build up down restart logs ps shell health rebuild clean

POETRY=python -m poetry

help:
	@echo "Comandos disponíveis:"
	@echo "  make install  - instala as dependências do backend"
	@echo "  make run      - executa o backend localmente"
	@echo "  make test     - executa todos os testes com Pytest"
	@echo "  make test-unit - executa os testes unitários"
	@echo "  make test-integration - executa os testes de integração"
	@echo "  make build    - constrói as imagens Docker"
	@echo "  make up       - inicia os containers"
	@echo "  make down     - encerra os containers"
	@echo "  make restart  - reinicia os serviços"
	@echo "  make logs     - acompanha os logs"
	@echo "  make ps       - exibe o estado dos containers"
	@echo "  make shell    - acessa o container do backend"
	@echo "  make health   - verifica a saúde da API"
	@echo "  make rebuild  - reconstrói o ambiente Docker"
	@echo "  make clean    - remove containers e volumes"

install:
	cd backend && $(POETRY) install

run:
	cd backend && $(POETRY) run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	cd backend && $(POETRY) run pytest -v

test-unit:
	cd backend && $(POETRY) run pytest tests/unit -v -m unit

test-integration:
	cd backend && $(POETRY) run pytest tests/integration -v -m integration

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

shell:
	docker compose exec backend /bin/bash

health:
	curl http://localhost:8000/health

rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

clean:
	docker compose down -v --remove-orphans

.PHONY: test-docker
test-docker:
	docker compose run --build --rm tests
