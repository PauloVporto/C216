const base = import.meta.env.VITE_API_URL || "";

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${base}/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à biblioteca. Verifique sua conexão e tente novamente.",
    );
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Confira os dados informados e tente novamente.",
    );
  }
  return response.status === 204 ? null : response.json();
}
