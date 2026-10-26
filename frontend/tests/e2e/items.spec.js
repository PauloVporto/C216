import { expect, test } from "@playwright/test";

test("cadastra itens sem chamar o backend e perde os dados ao recarregar", async ({
  page,
}) => {
  const externalRequests = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType()))
      externalRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
  await page.getByLabel("Nome", { exact: true }).fill("Notebook");
  await page.getByLabel("Descrição", { exact: true }).fill("14 polegadas");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("listitem")).toContainText("Notebook");
  await expect(page.getByRole("listitem")).toContainText("14 polegadas");
  await expect(page.getByText("Nenhum item cadastrado.")).toBeHidden();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("");
  await page.getByLabel("Nome", { exact: true }).fill("Mouse");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(2);
  expect(externalRequests).toEqual([]);
  await page.reload();
  await expect(page.getByText("Nenhum item cadastrado.")).toBeVisible();
});
test("valida nome obrigatório e limite de 100 caracteres", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  await page.getByLabel("Nome", { exact: true }).fill("a".repeat(101));
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("alert")).toContainText("100 caracteres");
  await expect(page.getByRole("listitem")).toHaveCount(0);
  await page.getByLabel("Nome", { exact: true }).fill("a".repeat(100));
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
});
test("permite cadastro em tela de celular sem rolagem horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByLabel("Nome", { exact: true }).fill("Item mobile");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("listitem")).toContainText("Item mobile");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
