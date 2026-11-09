import { describe, expect, it } from "vitest";
import { validateItem } from "../../src/validation.js";

describe("validateItem", () => {
  it.each(["", "   "])("rejeita nome vazio: %j", (name) => {
    expect(validateItem({ name, description: "" }).errors.name).toBe(
      "O nome é obrigatório.",
    );
  });
  it("aceita 100 caracteres e descrição opcional", () => {
    expect(
      validateItem({ name: "a".repeat(100), description: "" }).errors,
    ).toEqual({});
  });
  it("rejeita 101 caracteres", () => {
    expect(
      validateItem({ name: "a".repeat(101), description: "" }).errors.name,
    ).toContain("100 caracteres");
  });
  it("remove espaços das extremidades sem modificar a entrada", () => {
    const input = { name: "  Notebook  ", description: "  14 polegadas  " };
    expect(validateItem(input).values).toEqual({
      name: "Notebook",
      description: "14 polegadas",
    });
    expect(input.name).toBe("  Notebook  ");
  });
});
