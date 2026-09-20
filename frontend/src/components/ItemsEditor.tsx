interface ItemColumn {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: { value: string | number; label: string }[]
  width?: string
}

export default function ItemsEditor({
  columns,
  items,
  onChange,
  emptyItem,
}: {
  columns: ItemColumn[]
  items: Record<string, unknown>[]
  onChange: (items: Record<string, unknown>[]) => void
  emptyItem: Record<string, unknown>
}) {
  const updateItem = (index: number, name: string, value: unknown) => {
    const next = items.map((item, i) => (i === index ? { ...item, [name]: value } : item))
    onChange(next)
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    onChange([...items, { ...emptyItem }])
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.name} className="px-3 py-2 text-left font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.name} className="px-3 py-2">
                    {col.type === 'select' ? (
                      <select
                        className="w-full min-w-[140px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        value={(item[col.name] as string) ?? ''}
                        onChange={(e) => updateItem(index, col.name, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {col.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={col.type}
                        className="w-full min-w-[100px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                        value={(item[col.name] as string | number) ?? ''}
                        onChange={(e) => updateItem(index, col.name, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
      >
        + Add Line Item
      </button>
    </div>
  )
}
