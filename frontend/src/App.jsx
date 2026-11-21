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
import { businessDate, formatMoney, rentalQuote } from "./pricing.js";
import { request } from "./services/api.js";

const tabs = [
  { id: "games", label: "Catálogo", symbol: "▦" },
  { id: "customers", label: "Clientes", symbol: "♙" },
  { id: "rentals", label: "Locações", symbol: "⇄" },
];
const statusLabels = {
  active: "Em andamento",
  overdue: "Em atraso",
  returned: "Devolvido",
};
const empty = { games: [], customers: [], rentals: [] };
const today = businessDate;
const platforms = [
  "PS5",
  "PS4",
  "Xbox Series",
  "Xbox One",
  "Nintendo Switch",
  "PC",
];
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
  const [tab, setTab] = useState("games");
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rentalDraft, setRentalDraft] = useState({
    game_id: "",
    due_date: today(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [games, customers, rentals] = await Promise.all([
        request("/games"),
        request("/customers"),
        request("/rentals"),
      ]);
      setData({ games, customers, rentals });
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const active = data.rentals.filter(
    (rental) => rental.status !== "returned",
  ).length;
  const overdue = data.rentals.filter(
    (rental) => rental.status === "overdue",
  ).length;
  const available = data.games.reduce((sum, game) => sum + game.available, 0);
  const genres = [...new Set(data.games.map((game) => game.genre))].sort();
  const visible = useMemo(
    () =>
      data[tab].filter((item) => {
        const text =
          tab === "games"
            ? `${item.title} ${item.platform} ${item.genre}`
            : tab === "customers"
              ? `${item.name} ${item.email}`
              : `${item.game_title} ${item.customer_name}`;
        return (
          text
            .toLocaleLowerCase("pt-BR")
            .includes(query.toLocaleLowerCase("pt-BR")) &&
          (filter === "all" ||
            (tab === "games" ? item.genre === filter : item.status === filter))
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
    setRentalDraft({ game_id: "", due_date: today() });
    setModal({ kind, record });
  }
  function close() {
    if (!busy) setModal(null);
  }

  async function mutate(path, options, message) {
    setBusy(true);
    setError("");
    try {
      const result = await request(path, options);
      setModal(null);
      setNotice(typeof message === "function" ? message(result) : message);
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
    if (kind === "games") {
      values.copies = Number(values.copies);
      values.daily_rate_cents = Math.round(Number(values.daily_rate) * 100);
      delete values.daily_rate;
    }
    if (kind === "rentals") {
      values.game_id = Number(values.game_id);
      values.customer_id = Number(values.customer_id);
    }
    mutate(
      `/${kind}${id ? `/${id}` : ""}`,
      { method: id ? "PUT" : "POST", body: values },
      kind === "rentals"
        ? "Locação registrada. Bom jogo!"
        : "Cadastro salvo com sucesso.",
    );
  }

  const title =
    tab === "games"
      ? "Seu próximo jogo começa aqui."
      : tab === "customers"
        ? "Jogadores prontos para a próxima fase."
        : "Cada locação, uma nova aventura.";
  const action =
    tab === "games"
      ? "Adicionar jogo"
      : tab === "customers"
        ? "Adicionar cliente"
        : "Nova locação";
  const modalTitle =
    modal?.kind === "delete"
      ? "Excluir cadastro?"
      : modal?.kind === "return"
        ? "Confirmar devolução?"
        : modal?.kind === "games"
          ? modal.record
            ? "Editar jogo"
            : "Adicionar jogo"
          : modal?.kind === "customers"
            ? modal.record
              ? "Editar cliente"
              : "Adicionar cliente"
            : "Nova locação";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => changeTab("games")}
        >
          <span className="brand-icon" aria-hidden="true">
            ▶
          </span>
          <span>
            locaplay<small>ALUGUEL DE JOGOS</small>
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
            Grandes jogos,
            <br />
            novas partidas.
          </p>
          <small>
            Seu catálogo em dia.
            <br />
            Mais jogos nas mãos dos clientes.
          </small>
        </div>
        <div className="sidebar-footer">
          LOCAPLAY <span>© {new Date().getFullYear()}</span>
        </div>
      </aside>
      <main id="catalogo">
        <header className="topbar">
          <span>
            Minha locadora <span className="slash">/</span>{" "}
            <strong>{tabs.find((item) => item.id === tab).label}</strong>
          </span>
          <span className="workspace">
            <span aria-hidden="true">●</span> Gestão de locações
          </span>
        </header>
        <div className="content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">ESCOLHA O JOGO. COMECE A PARTIDA.</p>
              <h1>{title}</h1>
              <p>
                Gerencie jogos por plataforma, valores de diária e devoluções.
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
          <section className="stats" aria-label="Resumo da locadora">
            {[
              {
                name: "Jogos no catálogo",
                value: data.games.length,
                icon: "▦",
                caption: "Organizados por plataforma e gênero",
              },
              {
                name: "Cópias disponíveis",
                value: available,
                icon: "↗",
                caption: "Prontas para a próxima partida",
              },
              {
                name: "Locações ativas",
                value: active,
                icon: "⇄",
                caption: `${overdue} ${overdue === 1 ? "devolução em atraso" : "devoluções em atraso"}`,
              },
              {
                name: "Total das devoluções",
                value: formatMoney(
                  data.rentals
                    .filter((rental) => rental.status === "returned")
                    .reduce((sum, rental) => sum + rental.total_cents, 0),
                ),
                icon: "$",
                caption: "Totais calculados nas devoluções",
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
                  {tab === "games"
                    ? "Explore o catálogo"
                    : tab === "customers"
                      ? "Clientes da locadora"
                      : "Acompanhe as locações"}
                </h2>
                <p>
                  {tab === "games"
                    ? "Encontre o jogo certo para cada plataforma."
                    : tab === "customers"
                      ? "Cadastros e histórico dos seus jogadores."
                      : "Da retirada ao fechamento da locação."}
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
                    tab === "games"
                      ? "Buscar por título, plataforma ou gênero..."
                      : tab === "customers"
                        ? "Buscar por nome ou e-mail..."
                        : "Buscar por jogo ou cliente..."
                  }
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {tab !== "customers" && (
                <select
                  aria-label={
                    tab === "games" ? "Filtrar gênero" : "Filtrar status"
                  }
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">
                    {tab === "games" ? "Todos os gêneros" : "Todos os status"}
                  </option>
                  {tab === "games"
                    ? genres.map((genre) => (
                        <option key={genre}>{genre}</option>
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
                <h3>Carregando sua locadora...</h3>
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
                    : tab === "games"
                      ? "Seu catálogo começa aqui"
                      : tab === "customers"
                        ? "Seu primeiro cliente começa aqui"
                        : "Pronto para a primeira locação?"}
                </h3>
                <p>
                  {query || filter !== "all"
                    ? "Experimente outra busca ou altere os filtros."
                    : tab === "games"
                      ? "Cadastre um jogo com plataforma, cópias e valor da diária."
                      : tab === "customers"
                        ? "Cadastre um cliente para começar a alugar jogos."
                        : "Cadastre jogos e clientes e registre a primeira locação."}
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
            ) : tab === "games" ? (
              <div className="game-grid">
                {visible.map((game, index) => (
                  <article className="game-card" key={game.id}>
                    <div className={`game-cover cover-${index % 4}`}>
                      <span className="cover-label">CATÁLOGO LOCAPLAY</span>
                      <div className="cover-title">
                        {game.title}
                        <span>{game.platform}</span>
                      </div>
                      <span className="cover-mark" aria-hidden="true">
                        ✳
                      </span>
                    </div>
                    <div className="game-body">
                      <span className="genre">{game.genre}</span>
                      <h3>{game.title}</h3>
                      <p>
                        {game.platform}{" "}
                        <span className="daily-price">
                          {formatMoney(game.daily_rate_cents)}
                          <small>/dia</small>
                        </span>
                      </p>
                      <div className="game-availability">
                        <span
                          className={
                            game.available > 0 ? "available" : "unavailable"
                          }
                        >
                          ● {game.available > 0 ? "Disponível" : "Indisponível"}
                        </span>
                        <small>
                          {game.available}/{game.copies} cópias
                        </small>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          onClick={() => open("games", game)}
                        >
                          Editar
                        </button>
                        <button
                          className="danger-text"
                          type="button"
                          onClick={() =>
                            open("delete", {
                              ...game,
                              resource: "games",
                              label: game.title,
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
            ) : tab === "customers" ? (
              <div className="customer-grid">
                {visible.map((customer) => (
                  <article className="customer-card" key={customer.id}>
                    <span className="avatar" aria-hidden="true">
                      {customer.name.slice(0, 1).toUpperCase()}
                    </span>
                    <h3>{customer.name}</h3>
                    <p>{customer.email}</p>
                    <span className="genre">
                      {
                        data.rentals.filter(
                          (rental) =>
                            rental.customer_id === customer.id &&
                            rental.status !== "returned",
                        ).length
                      }{" "}
                      locações ativas
                    </span>
                    <div className="card-actions">
                      <button
                        type="button"
                        onClick={() => open("customers", customer)}
                      >
                        Editar
                      </button>
                      <button
                        className="danger-text"
                        type="button"
                        onClick={() =>
                          open("delete", {
                            ...customer,
                            resource: "customers",
                            label: customer.name,
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
                      <th>Jogo / Cliente</th>
                      <th>Locação</th>
                      <th>Devolução prevista</th>
                      <th>Total da locação</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((rental) => (
                      <tr key={rental.id}>
                        <td>
                          <strong>{rental.game_title}</strong>
                          <small>{rental.customer_name}</small>
                        </td>
                        <td>{dateLabel(rental.start_date)}</td>
                        <td>{dateLabel(rental.due_date)}</td>
                        <td>
                          <strong>{formatMoney(rental.total_cents)}</strong>
                          <small>
                            {rental.billable_days} diária(s)
                            {rental.late_days > 0
                              ? ` · ${rental.late_days} em atraso`
                              : ""}
                          </small>
                        </td>
                        <td>
                          <span className={`status ${rental.status}`}>
                            {statusLabels[rental.status]}
                          </span>
                        </td>
                        <td>
                          {rental.status !== "returned" ? (
                            <button
                              type="button"
                              className="secondary compact"
                              onClick={() => open("return", rental)}
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
            <span>Mais jogos em circulação. Mais partidas para contar.</span>
            <span>LocaPlay · Aluguel de jogos</span>
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
                  ? `Excluir “${modal.record.label}”? Esta ação não pode ser desfeita. Cadastros com histórico de locações são preservados.`
                  : `Confirmar a devolução de “${modal.record.game_title}” por ${modal.record.customer_name}? Total calculado: ${formatMoney(modal.record.total_cents)}. A cópia ficará disponível novamente.`}
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
                          `/rentals/${modal.record.id}/return`,
                          { method: "POST" },
                          (rental) =>
                            `Devolução registrada. Total da locação: ${formatMoney(rental.total_cents)}.`,
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
              {modal.kind === "games" && (
                <>
                  <Field label="Título">
                    <input
                      name="title"
                      required
                      maxLength={180}
                      defaultValue={modal.record?.title}
                      placeholder="Ex.: Astro Bot"
                    />
                  </Field>
                  <Field label="Plataforma">
                    <select
                      name="platform"
                      required
                      defaultValue={modal.record?.platform || "PS5"}
                    >
                      {platforms.map((platform) => (
                        <option key={platform}>{platform}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Diária (R$)">
                    <input
                      name="daily_rate"
                      type="number"
                      required
                      min="0.01"
                      max="10000"
                      step="0.01"
                      defaultValue={
                        modal.record
                          ? (modal.record.daily_rate_cents / 100).toFixed(2)
                          : "10.00"
                      }
                    />
                  </Field>
                  <div className="form-row">
                    <Field label="Gênero">
                      <input
                        name="genre"
                        required
                        maxLength={80}
                        defaultValue={modal.record?.genre}
                        placeholder="Ex.: Aventura"
                        list="genres"
                      />
                      <datalist id="genres">
                        {genres.map((genre) => (
                          <option key={genre} value={genre} />
                        ))}
                      </datalist>
                    </Field>
                    <Field label="Cópias">
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
              {modal.kind === "customers" && (
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
                      placeholder="cliente@exemplo.com"
                    />
                  </Field>
                </>
              )}
              {modal.kind === "rentals" && (
                <>
                  <p className="modal-description">
                    Escolha um jogo disponível e um cliente. A diária é fixada
                    no momento da locação.
                  </p>
                  <Field label="Jogo">
                    <select
                      name="game_id"
                      required
                      value={rentalDraft.game_id}
                      onChange={(event) =>
                        setRentalDraft({
                          ...rentalDraft,
                          game_id: event.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Selecione um jogo
                      </option>
                      {data.games
                        .filter((game) => game.available > 0)
                        .map((game) => (
                          <option value={game.id} key={game.id}>
                            {game.title} · {game.platform} ·{" "}
                            {formatMoney(game.daily_rate_cents)}/dia (
                            {game.available} disponíveis)
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Cliente">
                    <select name="customer_id" required defaultValue="">
                      <option value="" disabled>
                        Selecione um cliente
                      </option>
                      {data.customers.map((customer) => (
                        <option value={customer.id} key={customer.id}>
                          {customer.name} · {customer.email}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Devolução prevista">
                    <input
                      name="due_date"
                      type="date"
                      required
                      min={today()}
                      value={rentalDraft.due_date}
                      onChange={(event) =>
                        setRentalDraft({
                          ...rentalDraft,
                          due_date: event.target.value,
                        })
                      }
                    />
                  </Field>
                  {rentalDraft.game_id && rentalDraft.due_date >= today() && (
                    <div className="rental-quote" role="status">
                      <span>Total previsto</span>
                      <strong>
                        {formatMoney(
                          rentalQuote(
                            data.games.find(
                              (game) => game.id === Number(rentalDraft.game_id),
                            ),
                            rentalDraft.due_date,
                            today(),
                          ).total_cents,
                        )}
                      </strong>
                      <small>
                        Mínimo de 1 diária. Período reservado cobrado
                        integralmente; atraso acrescenta diárias. Datas de
                        Brasília.
                      </small>
                    </div>
                  )}
                  {(!data.customers.length || !available) && (
                    <p className="form-error">
                      Cadastre um cliente e tenha ao menos uma cópia disponível
                      para registrar uma locação.
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
                    (modal.kind === "rentals" &&
                      (!data.customers.length || !available))
                  }
                >
                  {busy
                    ? "Salvando..."
                    : modal.kind === "rentals"
                      ? "Registrar locação"
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
