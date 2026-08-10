.PHONY: help run install

POETRY=python -m poetry
APP=backend

help:
	@echo "Comandos disponíveis:"
	@echo "make install - Instala as dependências"
	@echo "make run     - Executa a aplicação"

install:
	$(POETRY) install

run:
	$(POETRY) run python -m http.server