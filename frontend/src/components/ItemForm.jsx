import { useState } from "react";
import { validateItem } from "../validation.js";
export function ItemForm({ onAdd }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  function handleSubmit(event) {
    event.preventDefault();
    const result = validateItem({ name, description });
    setErrors(result.errors);
    if (Object.keys(result.errors).length) return;
    onAdd(result.values);
    setName("");
    setDescription("");
  }
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="space-y-1">
        <label htmlFor="name" className="block font-medium">
          Nome
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : "name-hint"}
          className="w-full rounded border border-slate-400 px-3 py-2 focus:outline-2 focus:outline-blue-600"
        />
        <p id="name-hint" className="text-sm text-slate-600">
          Obrigatório, até 100 caracteres.
        </p>
        {errors.name && (
          <p id="name-error" role="alert" className="text-sm text-red-700">
            {errors.name}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <label htmlFor="description" className="block font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded border border-slate-400 px-3 py-2 focus:outline-2 focus:outline-blue-600"
        />
        <p className="text-sm text-slate-600">Opcional.</p>
      </div>
      <button
        type="submit"
        className="rounded bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        Adicionar
      </button>
    </form>
  );
}
