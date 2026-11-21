import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.jsx";
import { request } from "../src/services/api.js";

vi.mock("../src/services/api.js", () => ({ request: vi.fn() }));
const game = {
  id: 1,
  title: "Astro Bot",
  platform: "PS5",
  genre: "Aventura",
  copies: 2,
  daily_rate_cents: 1250,
  available: 1,
  active_rentals: 1,
};
const customer = { id: 1, name: "Ana Silva", email: "ana@example.com" };
const rental = {
  id: 1,
  game_id: 1,
  customer_id: 1,
  game_title: game.title,
  customer_name: customer.name,
  start_date: "2026-11-01",
  due_date: "2026-11-20",
  returned_at: null,
  status: "active",
  daily_rate_cents: 1250,
  total_cents: 8750,
  estimated_total_cents: 8750,
  billable_days: 7,
  late_days: 0,
  platform: "PS5",
};
let data;
beforeEach(() => {
  data = { games: [game], customers: [customer], rentals: [rental] };
  request.mockReset();
  request.mockImplementation((path) =>
    Promise.resolve(
      path === "/rentals/1/return"
        ? { ...rental, status: "returned" }
        : data[path.slice(1)] || {},
    ),
  );
});

async function ready() {
  render(<App />);
  await screen.findByRole("heading", { name: game.title });
}

describe("LocaPlay", () => {
  it("loads the catalog, searches and filters", async () => {
    await ready();
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Buscar" }),
      "inexistente",
    );
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.selectOptions(
      screen.getByLabelText("Filtrar gênero"),
      "Aventura",
    );
    expect(
      screen.getByRole("heading", { name: game.title }),
    ).toBeInTheDocument();
  });

  it("creates and edits a game through the form", async () => {
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Adicionar jogo" }));
    let dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Título"), "Sackboy");
    await user.selectOptions(
      within(dialog).getByLabelText("Plataforma"),
      "PS5",
    );
    await user.type(within(dialog).getByLabelText("Gênero"), "Aventura");
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar cadastro" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/games", {
        method: "POST",
        body: {
          title: "Sackboy",
          platform: "PS5",
          genre: "Aventura",
          copies: 1,
          daily_rate_cents: 1000,
        },
      }),
    );
    await screen.findByRole("button", { name: "Editar" });
    await user.click(screen.getByRole("button", { name: "Editar" }));
    dialog = screen.getByRole("dialog");
    await user.clear(within(dialog).getByLabelText("Título"));
    await user.type(within(dialog).getByLabelText("Título"), "Atualizado");
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar cadastro" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(
        "/games/1",
        expect.objectContaining({
          method: "PUT",
          body: expect.objectContaining({ title: "Atualizado" }),
        }),
      ),
    );
  });

  it("keeps a failed deletion open and shows the business error", async () => {
    await ready();
    const user = userEvent.setup();
    request.mockImplementation((path, options) =>
      options?.method === "DELETE"
        ? Promise.reject(new Error("Este jogo tem histórico de locações."))
        : Promise.resolve(
            path === "/rentals/1/return"
              ? { ...rental, status: "returned" }
              : data[path.slice(1)] || {},
          ),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "histórico de locações",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("registers a rental and confirms a return", async () => {
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Locações/ }));
    await user.click(screen.getByRole("button", { name: "Nova locação" }));
    let dialog = screen.getByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Jogo"), "1");
    expect(within(dialog).getByRole("status")).toHaveTextContent(/R\$\s*12,50/);
    await user.selectOptions(within(dialog).getByLabelText("Cliente"), "1");
    fireEvent.change(within(dialog).getByLabelText("Devolução prevista"), {
      target: { value: "2099-01-01" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar locação" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/rentals", {
        method: "POST",
        body: { game_id: 1, customer_id: 1, due_date: "2099-01-01" },
      }),
    );
    await user.click(await screen.findByRole("button", { name: "Devolver" }));
    dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar devolução" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/rentals/1/return", {
        method: "POST",
      }),
    );
  });

  it("shows a connection error and retries loading", async () => {
    request.mockRejectedValue(new Error("Conexão indisponível"));
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Conexão indisponível",
    );
    request.mockImplementation((path) => Promise.resolve(data[path.slice(1)]));
    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(
      await screen.findByRole("heading", { name: game.title }),
    ).toBeInTheDocument();
  });
});
