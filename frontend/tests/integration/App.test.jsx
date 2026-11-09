import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../../src/App.jsx";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  fetch.mockImplementation(async (_url, options) => ({
    ok: true,
    json: async () =>
      options ? { id: crypto.randomUUID(), ...JSON.parse(options.body) } : [],
  }));
});
afterEach(() => vi.unstubAllGlobals());

it("integra formulário e lista, preservando os itens anteriores", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(
    await screen.findByText("Nenhum item cadastrado."),
  ).toBeInTheDocument();
  await user.type(screen.getByLabelText("Nome"), "Notebook");
  await user.type(screen.getByLabelText("Descrição"), "14 polegadas");
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(screen.queryByText("Nenhum item cadastrado.")).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("Nome"), "Mouse");
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Notebook")).toBeInTheDocument();
  expect(screen.getByText("14 polegadas")).toBeInTheDocument();
});
it("bloqueia nome longo e permite corrigir o erro", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText("Nenhum item cadastrado.");
  await user.type(screen.getByLabelText("Nome"), "a".repeat(101));
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(screen.getByRole("alert")).toHaveTextContent("100 caracteres");
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText("Nome"));
  await user.type(screen.getByLabelText("Nome"), "Válido");
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("listitem")).toHaveTextContent("Válido");
});

it("mostra carregamento até a resposta e itens vindos da API", async () => {
  let resolve;
  fetch.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando itens...");
  resolve({ ok: true, json: async () => [{ id: 10, name: "Persistido" }] });
  expect(await screen.findByText("Persistido")).toBeInTheDocument();
});
it("mostra erro de conexão na listagem", async () => {
  fetch.mockRejectedValue(new TypeError("offline"));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível conectar à API.",
  );
});
it("preserva campos após conflito e limpa somente após sucesso", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText("Nenhum item cadastrado.");
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ detail: "Já existe um item com esse nome" }),
  });
  await user.type(screen.getByLabelText("Nome"), "Duplicado");
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Já existe um item com esse nome",
  );
  expect(screen.getByLabelText("Nome")).toHaveValue("Duplicado");
});
