# Evidências — Prática 7

Capturas e resultados reais da validação full-stack com React, FastAPI e PostgreSQL.

- `persistencia.png`: item recuperado após recarregar a página e mensagem 409 ao repetir o nome.
- `itens-mobile.png`: cadastro no viewport 375 × 812.
- `check-all.txt`: resultado do checklist completo, incluindo testes backend e E2E reais.

Os testes usam a stack isolada `lab-e2e` (API 8001, frontend 5174), sem mocks HTTP.
As capturas são produzidas automaticamente pelo Playwright, antes de remover a stack.

Resultado: `make check-all` aprovado — 19 testes Vitest, 35 Pytest e 3 E2E (57 no total), Biome e build Vite. Migração `007_items (head)` aplicada e stack isolada removida ao final.
