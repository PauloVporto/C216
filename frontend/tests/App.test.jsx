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
const book = {
  id: 1,
  title: "Dom Casmurro",
  author: "Machado de Assis",
  category: "Romance",
  copies: 2,
  available: 1,
  active_loans: 1,
};
const reader = { id: 1, name: "Ana Silva", email: "ana@example.com" };
const loan = {
  id: 1,
  book_id: 1,
  reader_id: 1,
  book_title: book.title,
  reader_name: reader.name,
  loan_date: "2026-11-01",
  due_date: "2026-11-20",
  returned_at: null,
  status: "active",
};
let data;
beforeEach(() => {
  data = { books: [book], readers: [reader], loans: [loan] };
  request.mockReset();
  request.mockImplementation((path) =>
    Promise.resolve(data[path.slice(1)] || {}),
  );
});

async function ready() {
  render(<App />);
  await screen.findByRole("heading", { name: book.title });
}

describe("Biblioteca", () => {
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
      screen.getByLabelText("Filtrar categoria"),
      "Romance",
    );
    expect(
      screen.getByRole("heading", { name: book.title }),
    ).toBeInTheDocument();
  });

  it("creates and edits a book through the form", async () => {
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Adicionar livro" }));
    let dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Título"), "O Cortiço");
    await user.type(within(dialog).getByLabelText("Autor"), "Aluísio Azevedo");
    await user.type(within(dialog).getByLabelText("Categoria"), "Romance");
    await user.click(
      within(dialog).getByRole("button", { name: "Salvar cadastro" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/books", {
        method: "POST",
        body: {
          title: "O Cortiço",
          author: "Aluísio Azevedo",
          category: "Romance",
          copies: 1,
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
        "/books/1",
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
        ? Promise.reject(new Error("Este livro tem histórico de empréstimos."))
        : Promise.resolve(data[path.slice(1)] || {}),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "histórico de empréstimos",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("registers a loan and confirms a return", async () => {
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Empréstimos/ }));
    await user.click(screen.getByRole("button", { name: "Novo empréstimo" }));
    let dialog = screen.getByRole("dialog");
    await user.selectOptions(within(dialog).getByLabelText("Livro"), "1");
    await user.selectOptions(within(dialog).getByLabelText("Leitor"), "1");
    fireEvent.change(within(dialog).getByLabelText("Devolução prevista"), {
      target: { value: "2099-01-01" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar empréstimo" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/loans", {
        method: "POST",
        body: { book_id: 1, reader_id: 1, due_date: "2099-01-01" },
      }),
    );
    await user.click(await screen.findByRole("button", { name: "Devolver" }));
    dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Confirmar devolução" }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/loans/1/return", {
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
      await screen.findByRole("heading", { name: book.title }),
    ).toBeInTheDocument();
  });
});
