import { expect, test } from "@playwright/test";
import { businessDate } from "../../src/pricing.js";

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function addGame(page, title) {
  await page
    .getByRole("button", { name: "Adicionar jogo", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Diária (R$)", { exact: true }).fill("12.50");
  await dialog.getByLabel("Título", { exact: true }).fill(title);
  await dialog.getByLabel("Plataforma", { exact: true }).selectOption("PS5");
  await dialog.getByLabel("Gênero", { exact: true }).fill("Aventura");
  await dialog.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(dialog).not.toBeVisible();
  return page
    .locator(".game-card")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}

test("game CRUD persists after reload and deletes from the real API", async ({
  page,
  request,
}) => {
  const title = `E2E acervo ${unique()}`;
  await page.goto("/");
  const card = await addGame(page, title);
  await expect(card).toBeVisible();
  await page.reload();
  await expect(card).toBeVisible();
  const games = await (await request.get("/api/games")).json();
  expect(games.some((game) => game.title === title)).toBe(true);
  await card.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Título", { exact: true }).fill(`${title} revisado`);
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  const edited = page.locator(".game-card").filter({
    has: page.getByRole("heading", {
      name: `${title} revisado`,
      exact: true,
    }),
  });
  await expect(edited).toBeVisible();
  await edited.getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(edited).toHaveCount(0);
  expect(
    (await (await request.get("/api/games")).json()).some(
      (game) => game.id === games.find((b) => b.title === title).id,
    ),
  ).toBe(false);
});

test("customer, checkout, stock protection, return and persisted history", async ({
  page,
  request,
}) => {
  const due = new Date(`${businessDate()}T12:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 3);
  const dueDate = due.toISOString().slice(0, 10);
  const suffix = unique();
  const title = `E2E circulação ${suffix}`;
  const name = `Cliente ${suffix}`;
  await page.goto("/");
  await addGame(page, title);
  await page.getByRole("button", { name: /Clientes/ }).click();
  await page
    .getByRole("button", { name: "Adicionar cliente", exact: true })
    .first()
    .click();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`${suffix}@example.com`);
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Locações/ }).click();
  await page
    .getByRole("button", { name: "Nova locação", exact: true })
    .first()
    .click();
  const games = await (await request.get("/api/games")).json();
  const customers = await (await request.get("/api/customers")).json();
  const game = games.find((entry) => entry.title === title);
  const customer = customers.find((entry) => entry.name === name);
  await page.getByLabel("Jogo", { exact: true }).selectOption(String(game.id));
  await page
    .getByLabel("Cliente", { exact: true })
    .selectOption(String(customer.id));
  await page.getByLabel("Devolução prevista", { exact: true }).fill(dueDate);
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    /R\$\s*37,50/,
  );
  await page.getByRole("button", { name: "Registrar locação" }).click();
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toContainText("Em andamento");
  await expect(row).toContainText(/R\$\s*37,50/);
  await page.reload();
  await page.getByRole("button", { name: /Locações/ }).click();
  await expect(row).toContainText(name);
  expect(
    (await (await request.get("/api/games")).json()).find(
      (entry) => entry.id === game.id,
    ).available,
  ).toBe(0);
  const duplicate = await request.post("/api/rentals", {
    data: { game_id: game.id, customer_id: customer.id, due_date: dueDate },
  });
  expect(duplicate.status()).toBe(409);
  const changed = await request.put(`/api/games/${game.id}`, {
    data: {
      title: game.title,
      platform: game.platform,
      genre: game.genre,
      copies: game.copies,
      daily_rate_cents: 9900,
    },
  });
  expect(changed.ok()).toBe(true);
  const contract = (await (await request.get("/api/rentals")).json()).find(
    (entry) => entry.game_id === game.id,
  );
  expect(contract.daily_rate_cents).toBe(1250);
  expect(contract.total_cents).toBe(3750);
  await row.getByRole("button", { name: "Devolver" }).click();
  await page.getByRole("button", { name: "Confirmar devolução" }).click();
  await expect(row).toContainText("Devolvido");
  expect(
    (await (await request.get("/api/games")).json()).find(
      (entry) => entry.id === game.id,
    ).available,
  ).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: /Locações/ }).click();
  await expect(row).toContainText("Devolvido");
  // Loan history is deliberately retained: these records live only in the isolated E2E project database.
});
