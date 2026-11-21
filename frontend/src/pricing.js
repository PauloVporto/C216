export const formatMoney = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );

export function businessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function rentalQuote(game, dueDate, startDate) {
  if (!game || !dueDate || !startDate) return { days: 0, total_cents: 0 };
  const days = Math.max(
    1,
    Math.round(
      (Date.parse(`${dueDate}T00:00:00Z`) -
        Date.parse(`${startDate}T00:00:00Z`)) /
        86400000,
    ),
  );
  return { days, total_cents: days * game.daily_rate_cents };
}
