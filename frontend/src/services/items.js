export const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const ITEMS_URL = `${API_URL}/items/`;
async function request(options, fallback) {
  let response;
  try {
    response = await fetch(ITEMS_URL, options);
  } catch {
    throw new Error("Não foi possível conectar à API.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.detail === "string" ? data.detail : fallback);
  }
  return response.json();
}
export function listItems() {
  return request(undefined, "Erro ao carregar os itens.");
}
export function createItem({ name, description }) {
  return request(
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    },
    "Erro ao cadastrar o item.",
  );
}
