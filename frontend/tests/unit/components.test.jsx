import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm.jsx";
import { ItemList } from "../../src/components/ItemList.jsx";

it("mostra o estado vazio", () => {
  render(<ItemList items={[]} />);
  expect(screen.getByText("Nenhum item cadastrado.")).toBeInTheDocument();
});
it("lista itens com e sem descrição", () => {
  render(
    <ItemList
      items={[
        { id: "1", name: "Notebook", description: "14 polegadas" },
        { id: "2", name: "Mouse", description: "" },
      ]}
    />,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("14 polegadas")).toBeInTheDocument();
  expect(screen.getByText("Mouse")).toBeInTheDocument();
});
it("não envia formulário inválido e associa o erro ao campo", async () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();
  render(<ItemForm onAdd={onAdd} />);
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(onAdd).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("O nome é obrigatório.");
});
it("envia dados normalizados e limpa os campos", async () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();
  render(<ItemForm onAdd={onAdd} />);
  await user.type(screen.getByLabelText("Nome"), "  Notebook  ");
  await user.type(screen.getByLabelText("Descrição"), "  14 polegadas  ");
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(onAdd).toHaveBeenCalledWith({
    name: "Notebook",
    description: "14 polegadas",
  });
  expect(screen.getByLabelText("Nome")).toHaveValue("");
  expect(screen.getByLabelText("Descrição")).toHaveValue("");
});
