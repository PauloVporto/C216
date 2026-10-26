export function ItemList({ items }) {
  if (!items.length)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-600">
        Nenhum item cadastrado.
      </p>
    );
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h3 className="break-words font-semibold">{item.name}</h3>
          {item.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-slate-600">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
