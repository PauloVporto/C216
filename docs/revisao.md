# Revisão técnica — LocaPlay

## Pontos para explicar na demonstração

- `schemas/rentals.py`: valida título, plataforma, gênero, cópias, diária em centavos, cliente e prazo. O contrato de locação recebe apenas jogo, cliente e data prevista; o servidor fixa o preço.
- `models/rentals.py`: jogos, clientes, locações, índices e restrições. A locação guarda sua diária e o total final, independente de alterações futuras no catálogo.
- `services/rentals.py`: aplica estoque, prazo, duplicidade e preservação do histórico. Calcule um exemplo com período reservado, devolução antecipada e atraso.
- Valores inteiros em centavos evitam erros de ponto flutuante nas cobranças. A interface apresenta reais, mas o contrato HTTP usa centavos.
- `business_today` usa Brasília. Na devolução, o timestamp é UTC e a data do negócio é calculada em `America/Sao_Paulo`.
- `SELECT FOR UPDATE` na linha do jogo serializa locações concorrentes e alterações de estoque. Explique como o teste evita duas reservas da última cópia.
- A sessão SQLAlchemy mantém uma transação por requisição e faz rollback em erros. A devolução fixa o total e libera a cópia sem apagar o contrato.
- Nginx encaminha `/api` ao FastAPI; o Compose inicia banco, aplica migrações e aguarda healthchecks.
- A migração 002 acrescenta o domínio de jogos sem destruir o banco anterior. Modelos e migração legados são mantidos por compatibilidade de dados, sem rotas de biblioteca na aplicação atual.
- Testes unitários, endpoints, componentes e E2E verificam aspectos diferentes. O E2E tem banco e volume próprios.

## Antes da entrega

1. Executar o projeto conforme o README na branch `projeto-final`.
2. Rodar `make check` e `make e2e` e revisar os resultados.
3. Demonstrar cadastro/edição/exclusão de jogos e clientes, orçamento, locação e devolução.
4. Alterar a diária de um jogo já alugado e mostrar que o contrato anterior mantém o preço.
5. Recarregar a página e reiniciar os contêineres para comprovar persistência.
6. Conferir os Checks `backend`, `frontend` e `e2e` no PR aberto para `Main`; não fazer merge.
7. Gravar o vídeo com narração própria, publicar e inserir o link no README.
8. Entregar os links no Teams até 28/11/2026.

A reorganização anterior dos commits foi documentada no PR e nos corpos dos commits. A mudança para aluguel de jogos representa uma evolução posterior real, com novas regras, migração, testes e interface. Não alterar datas nem fabricar histórico.
