.PHONY: help install run

POETRY=python -m poetry

help:
	@echo "Comandos disponíveis:"
	@echo "make install"
	@echo "make run"

install:
	$(POETRY) install

run:
	$(POETRY) run python -m http.server