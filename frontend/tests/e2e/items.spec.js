import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const uniqueName = (prefix) => `${prefix}-${randomUUID()}`;
test("cadastra e persiste após recarregar; exibe conflito de nome", async ({
  page,
}) => {
  const network = [];
  const methods = new Map();
  const devtools = await page.context().newCDPSession(page);
  await devtools.send("Network.enable");
  devtools.on("Network.requestWillBeSent", ({ requestId, request }) => {
    methods.set(requestId, request.method);
  });
  devtools.on("Network.responseReceived", ({ requestId, response }) => {
    if (response.url.endsWith("/items/"))
      network.push({
        method: methods.get(requestId),
        url: response.url,
        status: response.status,
        headers: response.headers,
      });
  });
  const name = uniqueName("Notebook");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("Descrição", { exact: true }).fill("14 polegadas");
  const post = page.waitForResponse(
    (r) => r.url().endsWith("/items/") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Adicionar" }).click();
  const response = await post;
  expect(response.status()).toBe(201);
  await expect
    .poll(() =>
      network.some(
        (entry) => entry.method === "OPTIONS" && entry.status === 200,
      ),
    )
    .toBe(true);
  expect(response.headers()["access-control-allow-origin"]).toBe(
    new URL(page.url()).origin,
  );
  const item = page.getByRole("listitem").filter({ hasText: name });
  await expect(item).toContainText("14 polegadas");
  await page.reload();
  await expect(item).toBeVisible();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Já existe um item com esse nome",
  );
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(name);
  await expect
    .poll(() =>
      network.some((entry) => entry.method === "POST" && entry.status === 201),
    )
    .toBe(true);
  await writeFile(
    "../img/pratica-7/rede-cors.json",
    JSON.stringify(network, null, 2),
  );
  await page.screenshot({
    path: "../img/pratica-7/persistencia.png",
    fullPage: true,
  });
});
test("valida nome obrigatório e limite antes de chamar a API", async ({
  page,
}) => {
  let posts = 0;
  page.on("request", (r) => {
    if (r.method() === "POST") posts++;
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("alert")).toHaveText("O nome é obrigatório.");
  await page.getByLabel("Nome", { exact: true }).fill("a".repeat(101));
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByRole("alert")).toContainText("100 caracteres");
  expect(posts).toBe(0);
});
test("cadastra no celular sem rolagem horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const name = uniqueName("Mobile");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: name }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "../img/pratica-7/itens-mobile.png",
    fullPage: true,
  });
});
