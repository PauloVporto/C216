# Prática 7 — Docker e integração full-stack

```bash
cp .env.example .env
make up-build
make db-upgrade
make db-current
make ps
```

`db`, `api` e `frontend` devem estar healthy. O Alembic deve mostrar `007_items (head)`.
Abra http://localhost:5173 e http://localhost:8000/docs. Cadastre um item,
recarregue a página e confira a persistência. Repetir o nome deve mostrar
"Já existe um item com esse nome". A aba Network mostra OPTIONS e POST `/items/`
e o header `access-control-allow-origin` autorizando a origem do frontend.

| Quem faz a chamada | Endereço |
|---|---|
| React no navegador → API | `http://localhost:8000` (`VITE_API_URL`) |
| API no Docker → PostgreSQL | `db:5432` (`DATABASE_URL`) |
| Contêiner → API na rede Docker | `http://api:8000` |

`CORS_ORIGINS` recebe uma lista de origens separadas por vírgulas.
Ao alterar portas no `.env`, ajuste também a URL pública e a origem permitida.
Após alterar código, use `make up-build`, pois o código é copiado para as imagens.
Em banco vazio, `make db-upgrade` é obrigatório para criar items.

`make down` encerra os serviços e preserva os dados. `make e2e` cria uma stack
separada `lab-e2e`, em 8001/5174, aplica Alembic, mostra a revisão e executa
Playwright contra a API e o PostgreSQL reais. Ao terminar, remove apenas os
serviços e o volume dessa stack de testes. `make frontend-test-e2e` roda os testes
contra uma stack já ativa (`E2E_BASE_URL`, padrão http://localhost:5173).

Para o checklist completo, instale Poetry, dependências (`make install` e
`make frontend-install`) e Chromium (`cd frontend && npx playwright install chromium`),
e execute `make check-all`. O comando inclui Ruff, Biome, Vitest, build,
Pytest e E2E isolado. `make lint` verifica Python; `make format` o formata com Ruff.
