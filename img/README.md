# Evidências da prática 5

Pendentes de execução com Docker Desktop iniciado; nenhum resultado foi simulado.

1. Execute `docker compose up --build -d`.
2. Execute `docker compose run --build --rm tests` e salve o print como `testes.png`.
3. Crie um aluno com `curl -X POST http://localhost:8000/alunos -H 'Content-Type: application/json' -d '{"nome":"Paulo","curso":"C216","email":"paulo@example.com"}'`.
4. Execute `docker compose restart backend db`, aguarde o banco ficar saudável e consulte `curl http://localhost:8000/alunos`; confirme que o ID e os dados persistem.
5. Execute `docker compose logs backend` e salve o print como `logs-api.png`.

Os testes são executados em outro banco e não apagam o aluno criado acima.
