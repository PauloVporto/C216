import { afterEach, expect, it, vi } from "vitest";
import { API_URL, createItem, listItems } from "../../src/services/items.js";

afterEach(() => vi.unstubAllGlobals());
it("lista usando a rota com barra final", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 1 }] }),
  );
  expect(await listItems()).toEqual([{ id: 1 }]);
  expect(fetch).toHaveBeenCalledWith(`${API_URL}/items/`, undefined);
});
it("envia JSON e descrição nula", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) }),
  );
  await createItem({ name: "Mouse", description: "" });
  expect(fetch).toHaveBeenCalledWith(`${API_URL}/items/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Mouse", description: null }),
  });
});
it("trata falha de rede", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError()));
  await expect(listItems()).rejects.toThrow("Não foi possível conectar à API.");
});
it("usa mensagem padrão em erro sem detalhe textual", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ detail: [] }) }),
  );
  await expect(createItem({ name: "Mouse" })).rejects.toThrow(
    "Erro ao cadastrar o item.",
  );
});
