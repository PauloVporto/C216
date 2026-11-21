import { describe, expect, it } from "vitest";
import { businessDate, rentalQuote } from "../src/pricing.js";

describe("Orçamento de locação", () => {
  it("cobra uma diária no mesmo dia", () => {
    expect(
      rentalQuote({ daily_rate_cents: 1299 }, "2026-11-17", "2026-11-17"),
    ).toEqual({ days: 1, total_cents: 1299 });
  });
  it("calcula o período reservado em centavos sem arredondar moedas", () => {
    expect(
      rentalQuote({ daily_rate_cents: 1299 }, "2026-11-20", "2026-11-17"),
    ).toEqual({ days: 3, total_cents: 3897 });
  });
  it("calcula datas do negócio no fuso de Brasília", () => {
    expect(businessDate(new Date("2026-11-18T01:00:00Z"))).toBe("2026-11-17");
  });
});
