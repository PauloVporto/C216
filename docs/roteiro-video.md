# Roteiro do vídeo — Entrelinhas (5–10 minutos)

Grave a aplicação real e narre com suas próprias palavras. Não basta ler este roteiro: explique decisões que você compreende e confira os resultados na tela.

1. **0:00–0:45 — Problema e solução.** Apresente uma pequena biblioteca que precisa controlar o acervo, leitores e exemplares emprestados. Mostre as três abas e os indicadores.
2. **0:45–1:30 — Arquitetura.** Abra o diretório `backend/app`: mostre rotas, serviços, repositórios, schemas e models. Explique que React envia HTTP, FastAPI valida e aplica regras, SQLAlchemy persiste no PostgreSQL. Mostre a migração `001_library.py`.
3. **1:30–2:15 — Contêineres.** Execute `make up` e `make status`. Mostre `docker-compose.yml`, os três serviços saudáveis e `/docs`. Explique que o banco inicia antes da migração e da API.
4. **2:15–3:15 — CRUD do acervo.** Cadastre um livro com um exemplar, busque por título, filtre categoria e edite o autor. Cadastre outro livro sem empréstimos e exclua esse segundo cadastro com confirmação. Cadastre e edite um leitor.
5. **3:15–4:45 — Empréstimos.** Crie um empréstimo do primeiro livro. Mostre que os exemplares disponíveis caem a zero. Tente reduzir o estoque com empréstimos ativos, se houver dois exemplares emprestados, e explique a proteção. Registre a devolução e mostre o histórico e a disponibilidade restaurada. Tente excluir o livro e explique por que o histórico impede a exclusão.
6. **4:45–5:45 — Persistência.** Atualize a página. Execute `make down` e `make up`, e mostre os mesmos dados. Explique o volume nomeado do PostgreSQL. Opcionalmente use `make db-shell` e `SELECT id, title, copies FROM books;`.
7. **5:45–7:30 — Qualidade e CI.** Execute `make test`, explique um teste de regra de negócio e o teste de concorrência. Mostre `make e2e` exercitando a stack real em ambiente separado. Abra o PR `projeto-final → Main` e mostre os três Checks aprovados. Não faça merge.
8. **7:30–8:00 — Fechamento.** Mostre README, instruções de execução e links de entrega. Comente uma decisão técnica e uma limitação do sistema.

Antes de publicar:

- Revise o código e pratique a demonstração.
- Evite mostrar arquivos `.env`, tokens ou configurações privadas na gravação.
- Publique o vídeo com acesso aos avaliadores e adicione o link no README.
- Envie os links do repositório, PR e vídeo na atividade do Teams até 28/11/2026.
