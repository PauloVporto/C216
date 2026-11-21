import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "../src/services/api.js";

afterEach(() => vi.unstubAllGlobals());
describe("HTTP client", () => {
  it("sends JSON and handles a 204 deletion", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetch);
    expect(await request("/games/1", { method: "DELETE" })).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      "/api/games/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
  it("exposes business errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ detail: "Não há cópias disponíveis." }),
      }),
    );
    await expect(
      request("/rentals", { method: "POST", body: {} }),
    ).rejects.toThrow("Não há cópias disponíveis.");
  });
  it("handles validation and network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: false, json: async () => ({ detail: [] }) }),
    );
    await expect(request("/games")).rejects.toThrow("Confira os dados");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(request("/games")).rejects.toThrow(
      "Não foi possível conectar",
    );
  });
});
