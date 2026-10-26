import { useState } from "react";
import { ItemForm } from "./components/ItemForm.jsx";
import { ItemList } from "./components/ItemList.jsx";
export default function App() {
  const [items, setItems] = useState([]);
  // Na Prática 7, esta função passará a chamar a API (POST /items).
  function addItem(values) {
    setItems((current) => [...current, { id: crypto.randomUUID(), ...values }]);
  }
  return (
    <main className="mx-auto min-h-screen max-w-xl space-y-6 p-4 text-slate-900 sm:p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Gerenciador de Itens</h1>
        <p className="text-slate-600">
          Cadastre e visualize seus itens. Os dados são temporários e
          desaparecem ao atualizar a página.
        </p>
      </header>
      <ItemForm onAdd={addItem} />
      <section aria-labelledby="items-heading" className="space-y-3">
        <h2 id="items-heading" className="text-xl font-semibold">
          Itens cadastrados
        </h2>
        <ItemList items={items} />
      </section>
    </main>
  );
}
