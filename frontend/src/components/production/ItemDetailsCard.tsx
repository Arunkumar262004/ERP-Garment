import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { ProductionOrderItem, Size } from '../../types'

export default function ItemDetailsCard({
  orderId,
  item,
  sizes,
  onSaved,
}: {
  orderId: string
  item: ProductionOrderItem
  sizes: Size[]
  onSaved?: () => void
}) {
  const [form, setForm] = useState(item)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(item)
  }, [item])

  const updateField = (field: keyof ProductionOrderItem, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const save = async () => {
    if (!form.id) return
    setSaving(true)
    try {
      await api.put(`/production-orders/${orderId}/items/${form.id}`, {
        sku: form.sku || undefined,
        size_id: form.size_id || undefined,
        color: form.color || undefined,
      })
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-700">
        {form.item_name}{' '}
        <span className="text-slate-400">
          ({form.quantity} {form.unit})
        </span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">SKU</label>
          <input
            type="text"
            placeholder="Auto-generated if blank"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={form.sku ?? ''}
            onChange={(e) => updateField('sku', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Size {!form.size_id && <span className="text-amber-600">(not set)</span>}
          </label>
          <select
            className={`w-full rounded-md border px-2 py-1.5 text-sm ${
              form.size_id ? 'border-slate-300' : 'border-amber-300 bg-amber-50'
            }`}
            value={form.size_id ?? ''}
            onChange={(e) => updateField('size_id', e.target.value)}
          >
            <option value="">Select…</option>
            {sizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Color</label>
          <input
            type="text"
            placeholder="Retail color…"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={form.color ?? ''}
            onChange={(e) => updateField('color', e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
