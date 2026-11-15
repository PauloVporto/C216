# Revisão técnica e preparação da entrega

## O que revisar e explicar

- Entrada e saída: `schemas/library.py` valida campos; as rotas retornam os códigos HTTP documentados.
- Persistência: `database/session.py` abre uma transação por requisição; erros fazem rollback.
- Concorrência: `create_loan` bloqueia a linha do livro antes de contar empréstimos. Entenda por que dois leitores não recebem o mesmo último exemplar.
- Histórico: foreign keys e regras de serviço impedem apagar um livro/leitor já relacionado a empréstimos.
- Devolução: o empréstimo recebe data de retorno e deixa de contar como ativo.
- Interface: identifique o cliente HTTP, o carregamento inicial e o tratamento de falhas nos formulários.
- Infraestrutura: explique o proxy de `/api`, a rede Compose, os healthchecks e o volume do PostgreSQL.
- Migrações: entenda upgrade, downgrade e por que a API não usa `create_all` na inicialização.
- Testes: diferencie testes de regras, endpoints, componentes e E2E com banco real.

## Verificação antes de entregar

1. Executar a aplicação conforme o README a partir de um checkout da branch `projeto-final`.
2. Executar `make check` e `make e2e` e revisar os resultados.
3. Conferir no GitHub o PR aberto para `Main` e os jobs `backend`, `frontend` e `e2e` aprovados.
4. Revisar as alterações com que você concorda e incorporar sua própria revisão e evolução no histórico real de commits. Não alterar datas nem fabricar histórico.
5. Gravar o vídeo com sua narração, publicar e colocar o link no README.
6. Entregar os links pelo Teams e validar o acesso dos avaliadores.

O código com apoio de IA não substitui a revisão, o domínio técnico e a demonstração pessoal exigidos pelo enunciado.
