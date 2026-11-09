import { useEffect, useState } from "react";
import { ItemForm } from "./components/ItemForm.jsx";
import { ItemList } from "./components/ItemList.jsx";
import { createItem, listItems } from "./services/items.js";
export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let active = true;
    listItems()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function addItem(values) {
    const created = await createItem(values);
    setItems((current) => [...current, created]);
  }
  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-4 text-slate-900 sm:p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Gerenciador de Itens</h1>
        <p className="text-slate-600">
          Cadastre e visualize seus itens. Os dados ficam salvos no PostgreSQL,
          inclusive após atualizar a página.
        </p>
      </header>
      <ItemForm onAdd={addItem} disabled={loading || !!loadError} />
      <section aria-labelledby="items-heading" className="space-y-3">
        <h2 id="items-heading" className="text-xl font-semibold">
          Itens cadastrados
        </h2>
        {loading ? (
          <p role="status">Carregando itens...</p>
        ) : loadError ? (
          <p role="alert">{loadError}</p>
        ) : (
          <ItemList items={items} />
        )}
      </section>
    </main>
  );
}
