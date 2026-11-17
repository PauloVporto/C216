import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import Modal from "./components/Modal.jsx";
import { request } from "./services/api.js";

const tabs = [
  { id: "books", label: "Acervo", symbol: "▤" },
  { id: "readers", label: "Leitores", symbol: "♙" },
  { id: "loans", label: "Empréstimos", symbol: "⇄" },
];
const statusLabels = {
  active: "Em andamento",
  overdue: "Em atraso",
  returned: "Devolvido",
};
const empty = { books: [], readers: [], loans: [] };
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dateLabel = (date) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));

function Field({ label, children }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement(child) && ["input", "select"].includes(child.type)
          ? cloneElement(child, { id })
          : child,
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("books");
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [books, readers, loans] = await Promise.all([
        request("/books"),
        request("/readers"),
        request("/loans"),
      ]);
      setData({ books, readers, loans });
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const active = data.loans.filter((loan) => loan.status !== "returned").length;
  const overdue = data.loans.filter((loan) => loan.status === "overdue").length;
  const available = data.books.reduce((sum, book) => sum + book.available, 0);
  const categories = [
    ...new Set(data.books.map((book) => book.category)),
  ].sort();
  const visible = useMemo(
    () =>
      data[tab].filter((item) => {
        const text =
          tab === "books"
            ? `${item.title} ${item.author} ${item.category}`
            : tab === "readers"
              ? `${item.name} ${item.email}`
              : `${item.book_title} ${item.reader_name}`;
        return (
          text
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")) &&
          (filter === "all" ||
            (tab === "books"
              ? item.category === filter
              : item.status === filter))
        );
      }),
    [data, tab, query, filter],
  );

  function changeTab(next) {
    setTab(next);
    setQuery("");
    setFilter("all");
    setNotice("");
  }
  function open(kind, record = null) {
    setError("");
    setNotice("");
    setModal({ kind, record });
  }
  function close() {
    if (!busy) setModal(null);
  }

  async function mutate(path, options, message) {
    setBusy(true);
    setError("");
    try {
      await request(path, options);
      setModal(null);
      setNotice(message);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const kind = modal.kind;
    const id = modal.record?.id;
    if (kind === "books") values.copies = Number(values.copies);
    if (kind === "loans") {
      values.book_id = Number(values.book_id);
      values.reader_id = Number(values.reader_id);
    }
    mutate(
      `/${kind}${id ? `/${id}` : ""}`,
      { method: id ? "PUT" : "POST", body: values },
      kind === "loans"
        ? "Empréstimo registrado. Boa leitura!"
        : "Cadastro salvo com sucesso.",
    );
  }

  const title =
    tab === "books"
      ? "Cada livro, uma possibilidade."
      : tab === "readers"
        ? "Quem dá vida às histórias."
        : "Histórias em movimento.";
  const action =
    tab === "books"
      ? "Adicionar livro"
      : tab === "readers"
        ? "Adicionar leitor"
        : "Novo empréstimo";
  const modalTitle =
    modal?.kind === "delete"
      ? "Excluir cadastro?"
      : modal?.kind === "return"
        ? "Confirmar devolução?"
        : modal?.kind === "books"
          ? modal.record
            ? "Editar livro"
            : "Adicionar livro"
          : modal?.kind === "readers"
            ? modal.record
              ? "Editar leitor"
              : "Adicionar leitor"
            : "Novo empréstimo";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => changeTab("books")}
        >
          <span className="brand-icon" aria-hidden="true">
            ▥
          </span>
          <span>
            entrelinhas<small>BIBLIOTECA VIVA</small>
          </span>
        </button>
        <div className="nav-caption">ESPAÇO DE GESTÃO</div>
        <nav aria-label="Navegação principal">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => changeTab(item.id)}
            >
              <span aria-hidden="true">{item.symbol}</span>
              {item.label}
              <span className="nav-count">{data[item.id].length}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span aria-hidden="true">✳</span>
          <p>
            Boas histórias
            <br />
            merecem circular.
          </p>
          <small>
            Um acervo organizado.
            <br />
            Mais encontros com a leitura.
          </small>
        </div>
        <div className="sidebar-footer">
          ENTRELINHAS <span>© {new Date().getFullYear()}</span>
        </div>
      </aside>
      <main id="acervo">
        <header className="topbar">
          <span>
            Minha biblioteca <span className="slash">/</span>{" "}
            <strong>{tabs.find((item) => item.id === tab).label}</strong>
          </span>
          <span className="workspace">
            <span aria-hidden="true">●</span> Gestão da biblioteca
          </span>
        </header>
        <div className="content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">ORGANIZAR PARA COMPARTILHAR</p>
              <h1>{title}</h1>
              <p>
                Cuide do acervo, conecte leitores e acompanhe novas jornadas.
              </p>
            </div>
            <button
              className="primary"
              type="button"
              onClick={() => open(tab)}
              disabled={loading || !!loadError}
            >
              <span aria-hidden="true">＋</span> {action}
            </button>
          </section>
          <section className="stats" aria-label="Resumo da biblioteca">
            {[
              {
                name: "Títulos no acervo",
                value: data.books.length,
                icon: "▤",
                caption: "Histórias esperando por leitores",
              },
              {
                name: "Exemplares disponíveis",
                value: available,
                icon: "↗",
                caption: "Prontos para um novo capítulo",
              },
              {
                name: "Empréstimos ativos",
                value: active,
                icon: "⇄",
                caption: `${overdue} ${overdue === 1 ? "devolução em atraso" : "devoluções em atraso"}`,
              },
              {
                name: "Leitores cadastrados",
                value: data.readers.length,
                icon: "♙",
                caption: "Nossa comunidade de leitura",
              },
            ].map((stat) => (
              <article className="stat" key={stat.name}>
                <div>
                  <span>{stat.name}</span>
                  <span className="stat-icon" aria-hidden="true">
                    {stat.icon}
                  </span>
                </div>
                <strong>{loading ? "—" : stat.value}</strong>
                <small>{stat.caption}</small>
              </article>
            ))}
          </section>
          {notice && (
            <div className="notice" role="status">
              ✓ {notice}
              <button
                type="button"
                aria-label="Dispensar mensagem"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          <section className="collection" aria-labelledby="collection-title">
            <div className="collection-heading">
              <div>
                <h2 id="collection-title">
                  {tab === "books"
                    ? "Explore o acervo"
                    : tab === "readers"
                      ? "Comunidade de leitores"
                      : "Acompanhe os empréstimos"}
                </h2>
                <p>
                  {tab === "books"
                    ? "Um lugar para cada história."
                    : tab === "readers"
                      ? "Pessoas, encontros e novas leituras."
                      : "Da primeira página até a devolução."}
                </p>
              </div>
              <span className="total-tag">{data[tab].length} registros</span>
            </div>
            <div className="toolbar">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Buscar"
                  type="search"
                  placeholder={
                    tab === "books"
                      ? "Buscar por título, autor ou categoria..."
                      : tab === "readers"
                        ? "Buscar por nome ou e-mail..."
                        : "Buscar por livro ou leitor..."
                  }
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {tab !== "readers" && (
                <select
                  aria-label={
                    tab === "books" ? "Filtrar categoria" : "Filtrar status"
                  }
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">
                    {tab === "books"
                      ? "Todas as categorias"
                      : "Todos os status"}
                  </option>
                  {tab === "books"
                    ? categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))
                    : Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                </select>
              )}
            </div>
            {loading ? (
              <div className="empty" role="status">
                <span className="empty-symbol">◌</span>
                <h3>Carregando sua biblioteca...</h3>
              </div>
            ) : loadError ? (
              <div className="empty" role="alert">
                <h3>Não foi possível carregar os dados</h3>
                <p>{loadError}</p>
                <button type="button" className="secondary" onClick={load}>
                  Tentar novamente
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="empty">
                <span className="empty-symbol" aria-hidden="true">
                  {tabs.find((item) => item.id === tab).symbol}
                </span>
                <h3>
                  {query || filter !== "all"
                    ? "Nenhum resultado encontrado"
                    : tab === "books"
                      ? "A próxima história começa aqui"
                      : tab === "readers"
                        ? "Sua comunidade começa aqui"
                        : "Pronto para colocar histórias em circulação?"}
                </h3>
                <p>
                  {query || filter !== "all"
                    ? "Experimente outra busca ou altere os filtros."
                    : tab === "books"
                      ? "Adicione seu primeiro livro e dê vida à biblioteca."
                      : tab === "readers"
                        ? "Cadastre um leitor para começar a emprestar livros."
                        : "Cadastre livros e leitores e registre o primeiro empréstimo."}
                </p>
                {!query && filter === "all" && (
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => open(tab)}
                  >
                    {action}
                  </button>
                )}
              </div>
            ) : tab === "books" ? (
              <div className="book-grid">
                {visible.map((book, index) => (
                  <article className="book-card" key={book.id}>
                    <div className={`book-cover cover-${index % 4}`}>
                      <span className="cover-label">ACERVO ENTRELINHAS</span>
                      <div className="cover-title">
                        {book.title}
                        <span>{book.author}</span>
                      </div>
                      <span className="cover-mark" aria-hidden="true">
                        ✳
                      </span>
                    </div>
                    <div className="book-body">
                      <span className="category">{book.category}</span>
                      <h3>{book.title}</h3>
                      <p>{book.author}</p>
                      <div className="book-availability">
                        <span
                          className={
                            book.available > 0 ? "available" : "unavailable"
                          }
                        >
                          ● {book.available > 0 ? "Disponível" : "Indisponível"}
                        </span>
                        <small>
                          {book.available}/{book.copies} exemplares
                        </small>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          onClick={() => open("books", book)}
                        >
                          Editar
                        </button>
                        <button
                          className="danger-text"
                          type="button"
                          onClick={() =>
                            open("delete", {
                              ...book,
                              resource: "books",
                              label: book.title,
                            })
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : tab === "readers" ? (
              <div className="reader-grid">
                {visible.map((reader) => (
                  <article className="reader-card" key={reader.id}>
                    <span className="avatar" aria-hidden="true">
                      {reader.name.slice(0, 1).toUpperCase()}
                    </span>
                    <h3>{reader.name}</h3>
                    <p>{reader.email}</p>
                    <span className="category">
                      {
                        data.loans.filter(
                          (loan) =>
                            loan.reader_id === reader.id &&
                            loan.status !== "returned",
                        ).length
                      }{" "}
                      empréstimos ativos
                    </span>
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => open("readers", reader)}
                      >
                        Editar
                      </button>
                      <button
                        className="danger-text"
                        type="button"
                        onClick={() =>
                          open("delete", {
                            ...reader,
                            resource: "readers",
                            label: reader.name,
                          })
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Livro / Leitor</th>
                      <th>Empréstimo</th>
                      <th>Devolução prevista</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((loan) => (
                      <tr key={loan.id}>
                        <td>
                          <strong>{loan.book_title}</strong>
                          <small>{loan.reader_name}</small>
                        </td>
                        <td>{dateLabel(loan.loan_date)}</td>
                        <td>{dateLabel(loan.due_date)}</td>
                        <td>
                          <span className={`status ${loan.status}`}>
                            {statusLabels[loan.status]}
                          </span>
                        </td>
                        <td>
                          {loan.status !== "returned" ? (
                            <button
                              type="button"
                              className="secondary compact"
                              onClick={() => open("return", loan)}
                            >
                              Devolver
                            </button>
                          ) : (
                            <span className="muted">Concluído</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <footer className="content-footer">
            <span>Feito para cuidar de livros. E de quem lê.</span>
            <span>Entrelinhas · Biblioteca</span>
          </footer>
        </div>
      </main>
      {modal && (
        <Modal title={modalTitle} onClose={close} busy={busy}>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {modal.kind === "delete" || modal.kind === "return" ? (
            <>
              <p className="modal-description">
                {modal.kind === "delete"
                  ? `Excluir “${modal.record.label}”? Esta ação não pode ser desfeita. Cadastros com histórico de empréstimos são preservados.`
                  : `Confirmar a devolução de “${modal.record.book_title}” por ${modal.record.reader_name}? O exemplar ficará disponível novamente.`}
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={modal.kind === "delete" ? "danger" : "primary"}
                  disabled={busy}
                  onClick={() =>
                    modal.kind === "delete"
                      ? mutate(
                          `/${modal.record.resource}/${modal.record.id}`,
                          { method: "DELETE" },
                          "Cadastro excluído.",
                        )
                      : mutate(
                          `/loans/${modal.record.id}/return`,
                          { method: "POST" },
                          "Devolução registrada. Exemplar disponível novamente.",
                        )
                  }
                >
                  {busy
                    ? "Aguarde..."
                    : modal.kind === "delete"
                      ? "Confirmar exclusão"
                      : "Confirmar devolução"}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={submit}>
              {modal.kind === "books" && (
                <>
                  <Field label="Título">
                    <input
                      name="title"
                      required
                      maxLength={180}
                      defaultValue={modal.record?.title}
                      placeholder="Ex.: Dom Casmurro"
                    />
                  </Field>
                  <Field label="Autor">
                    <input
                      name="author"
                      required
                      maxLength={140}
                      defaultValue={modal.record?.author}
                      placeholder="Ex.: Machado de Assis"
                    />
                  </Field>
                  <div className="form-row">
                    <Field label="Categoria">
                      <input
                        name="category"
                        required
                        maxLength={80}
                        defaultValue={modal.record?.category}
                        placeholder="Ex.: Literatura brasileira"
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </Field>
                    <Field label="Exemplares">
                      <input
                        name="copies"
                        type="number"
                        required
                        min="1"
                        max="10000"
                        step="1"
                        defaultValue={modal.record?.copies || 1}
                      />
                    </Field>
                  </div>
                </>
              )}
              {modal.kind === "readers" && (
                <>
                  <Field label="Nome">
                    <input
                      name="name"
                      required
                      maxLength={140}
                      defaultValue={modal.record?.name}
                      placeholder="Nome completo"
                    />
                  </Field>
                  <Field label="E-mail">
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={180}
                      defaultValue={modal.record?.email}
                      placeholder="leitor@exemplo.com"
                    />
                  </Field>
                </>
              )}
              {modal.kind === "loans" && (
                <>
                  <p className="modal-description">
                    Escolha um livro disponível e um leitor. Cada leitor pode
                    ter um empréstimo ativo por título.
                  </p>
                  <Field label="Livro">
                    <select name="book_id" required defaultValue="">
                      <option value="" disabled>
                        Selecione um livro
                      </option>
                      {data.books
                        .filter((book) => book.available > 0)
                        .map((book) => (
                          <option value={book.id} key={book.id}>
                            {book.title} ({book.available} disponíveis)
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Leitor">
                    <select name="reader_id" required defaultValue="">
                      <option value="" disabled>
                        Selecione um leitor
                      </option>
                      {data.readers.map((reader) => (
                        <option value={reader.id} key={reader.id}>
                          {reader.name} · {reader.email}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Devolução prevista">
                    <input name="due_date" type="date" required min={today()} />
                  </Field>
                  {(!data.readers.length || !available) && (
                    <p className="form-error">
                      Cadastre um leitor e tenha ao menos um exemplar disponível
                      para registrar um empréstimo.
                    </p>
                  )}
                </>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={close}
                  disabled={busy}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={
                    busy ||
                    (modal.kind === "loans" &&
                      (!data.readers.length || !available))
                  }
                >
                  {busy
                    ? "Salvando..."
                    : modal.kind === "loans"
                      ? "Registrar empréstimo"
                      : "Salvar cadastro"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
