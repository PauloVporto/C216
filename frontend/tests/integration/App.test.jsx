import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "../../src/App.jsx";

it("integra formulário e lista, preservando os itens anteriores", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
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
