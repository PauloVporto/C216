import { expect, test } from "@playwright/test";

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function addBook(page, title) {
  await page
    .getByRole("button", { name: "Adicionar livro", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título", { exact: true }).fill(title);
  await dialog.getByLabel("Autor", { exact: true }).fill("Machado de Assis");
  await dialog
    .getByLabel("Categoria", { exact: true })
    .fill("Literatura brasileira");
  await dialog.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(dialog).not.toBeVisible();
  return page
    .locator(".book-card")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}

test("book CRUD persists after reload and deletes from the real API", async ({
  page,
  request,
}) => {
  const title = `E2E acervo ${unique()}`;
  await page.goto("/");
  const card = await addBook(page, title);
  await expect(card).toBeVisible();
  await page.reload();
  await expect(card).toBeVisible();
  const books = await (await request.get("/api/books")).json();
  expect(books.some((book) => book.title === title)).toBe(true);
  await card.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Título", { exact: true }).fill(`${title} revisado`);
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  const edited = page.locator(".book-card").filter({
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
    (await (await request.get("/api/books")).json()).some(
      (book) => book.id === books.find((b) => b.title === title).id,
    ),
  ).toBe(false);
});

test("reader, checkout, stock protection, return and persisted history", async ({
  page,
  request,
}) => {
  const suffix = unique();
  const title = `E2E circulação ${suffix}`;
  const name = `Leitor ${suffix}`;
  await page.goto("/");
  await addBook(page, title);
  await page.getByRole("button", { name: /Leitores/ }).click();
  await page
    .getByRole("button", { name: "Adicionar leitor", exact: true })
    .first()
    .click();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`${suffix}@example.com`);
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Empréstimos/ }).click();
  await page
    .getByRole("button", { name: "Novo empréstimo", exact: true })
    .first()
    .click();
  const books = await (await request.get("/api/books")).json();
  const readers = await (await request.get("/api/readers")).json();
  const book = books.find((entry) => entry.title === title);
  const reader = readers.find((entry) => entry.name === name);
  await page.getByLabel("Livro", { exact: true }).selectOption(String(book.id));
  await page
    .getByLabel("Leitor", { exact: true })
    .selectOption(String(reader.id));
  await page
    .getByLabel("Devolução prevista", { exact: true })
    .fill("2099-01-01");
  await page.getByRole("button", { name: "Registrar empréstimo" }).click();
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toContainText("Em andamento");
  await page.reload();
  await page.getByRole("button", { name: /Empréstimos/ }).click();
  await expect(row).toContainText(name);
  expect(
    (await (await request.get("/api/books")).json()).find(
      (entry) => entry.id === book.id,
    ).available,
  ).toBe(0);
  const duplicate = await request.post("/api/loans", {
    data: { book_id: book.id, reader_id: reader.id, due_date: "2099-01-01" },
  });
  expect(duplicate.status()).toBe(409);
  await row.getByRole("button", { name: "Devolver" }).click();
  await page.getByRole("button", { name: "Confirmar devolução" }).click();
  await expect(row).toContainText("Devolvido");
  expect(
    (await (await request.get("/api/books")).json()).find(
      (entry) => entry.id === book.id,
    ).available,
  ).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: /Empréstimos/ }).click();
  await expect(row).toContainText("Devolvido");
  // Loan history is deliberately retained: these records live only in the isolated E2E project database.
});
