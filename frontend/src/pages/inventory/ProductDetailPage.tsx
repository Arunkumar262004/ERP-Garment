import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, Product, ProductVariant, Size } from '../../types'
import ActionButton from '../../components/ActionButton'

interface VariantDraft {
  size_id: string
  color: string
  sku: string
  stock_quantity: string
  price: string
  cost_price: string
}

function emptyDraft(): VariantDraft {
  return { size_id: '', color: '', sku: '', stock_quantity: '0', price: '', cost_price: '' }
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<VariantDraft>(emptyDraft())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<VariantDraft>(emptyDraft())

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get<Product>(`/products/${id}`)).data,
  })

  const { data: sizes } = useQuery({
    queryKey: ['sizes'],
    queryFn: async () => (await api.get<Paginated<Size>>('/sizes', { params: { status: 'active' } })).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['product', id] })

  const addMutation = useMutation({
    mutationFn: () =>
      api.post(`/products/${id}/variants`, {
        size_id: draft.size_id || undefined,
        color: draft.color || undefined,
        sku: draft.sku,
        stock_quantity: Number(draft.stock_quantity || 0),
        price: Number(draft.price || 0),
        cost_price: draft.cost_price ? Number(draft.cost_price) : undefined,
      }),
    onSuccess: () => {
      invalidate()
      setAdding(false)
      setDraft(emptyDraft())
    },
  })

  const updateMutation = useMutation({
    mutationFn: (variantId: number) =>
      api.put(`/product-variants/${variantId}`, {
        size_id: editDraft.size_id || undefined,
        color: editDraft.color || undefined,
        sku: editDraft.sku,
        stock_quantity: Number(editDraft.stock_quantity || 0),
        price: Number(editDraft.price || 0),
        cost_price: editDraft.cost_price ? Number(editDraft.cost_price) : undefined,
      }),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (variantId: number) => api.delete(`/product-variants/${variantId}`),
    onSuccess: invalidate,
  })

  const startEdit = (v: ProductVariant) => {
    setEditingId(v.id)
    setEditDraft({
      size_id: v.size_id ? String(v.size_id) : '',
      color: v.color ?? '',
      sku: v.sku,
      stock_quantity: String(v.stock_quantity),
      price: String(v.price),
      cost_price: v.cost_price ? String(v.cost_price) : '',
    })
  }

  const sizeOptions = sizes ?? []

  return (
    <div>
      <Link to="/inventory" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back
      </Link>

      {isLoading && <p className="text-slate-400">Loading…</p>}

      {product && (
        <>
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xl font-bold text-slate-800">{product.name}</h2>
            <p className="text-sm text-slate-500">
              {[product.brand?.name, product.category, product.garment_type, product.hsn_code && `HSN ${product.hsn_code}`]
                .filter(Boolean)
                .join(' · ') || 'No additional details'}
            </p>
            {product.description && <p className="mt-2 text-sm text-slate-600">{product.description}</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Variants</p>
              <button
                onClick={() => setAdding((v) => !v)}
                className="flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                <Plus size={13} /> Add Variant
              </button>
            </div>

            {adding && (
              <div className="mb-3 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-6">
                <select
                  value={draft.size_id}
                  onChange={(e) => setDraft({ ...draft, size_id: e.target.value })}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Size…</option>
                  {sizeOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Color"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="SKU *"
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={draft.stock_quantity}
                  onChange={(e) => setDraft({ ...draft, stock_quantity: e.target.value })}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  placeholder="Price *"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <button
                  disabled={!draft.sku || !draft.price || addMutation.isPending}
                  onClick={() => addMutation.mutate()}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Color</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(product.variants ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      No variants yet.
                    </td>
                  </tr>
                )}
                {(product.variants ?? []).map((v) =>
                  editingId === v.id ? (
                    <tr key={v.id} className="bg-slate-50">
                      <td className="px-3 py-2">
                        <input
                          value={editDraft.sku}
                          onChange={(e) => setEditDraft({ ...editDraft, sku: e.target.value })}
                          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={editDraft.size_id}
                          onChange={(e) => setEditDraft({ ...editDraft, size_id: e.target.value })}
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="">—</option>
                          {sizeOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={editDraft.color}
                          onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })}
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={editDraft.stock_quantity}
                          onChange={(e) => setEditDraft({ ...editDraft, stock_quantity: e.target.value })}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={editDraft.price}
                          onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateMutation.mutate(v.id)}
                            className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{v.sku}</td>
                      <td className="px-3 py-2">{v.size?.name ?? '—'}</td>
                      <td className="px-3 py-2">{v.color ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={Number(v.stock_quantity) <= 0 ? 'font-semibold text-red-600' : ''}>
                          {v.stock_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2">₹{Number(v.price).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton icon={Pencil} label="Edit" variant="edit" onClick={() => startEdit(v)} />
                          <ActionButton
                            icon={Trash2}
                            label="Delete"
                            variant="delete"
                            onClick={() => confirm('Delete this variant?') && deleteMutation.mutate(v.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
