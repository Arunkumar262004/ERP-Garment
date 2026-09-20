import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Package, Plus } from 'lucide-react'
import { api } from '../../api/client'
import type { Brand, Paginated, Product } from '../../types'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'

interface ProductFormState {
  name: string
  brand_id: string
  garment_type: string
  category: string
  hsn_code: string
  description: string
  status: string
}

function emptyForm(): ProductFormState {
  return { name: '', brand_id: '', garment_type: '', category: '', hsn_code: '', description: '', status: 'active' }
}

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { page } })).data,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands-all'],
    queryFn: async () =>
      (await api.get<Paginated<Brand>>('/brands', { params: { status: 'active', per_page: 100 } })).data.data,
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/products', { ...form, brand_id: form.brand_id || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      setForm(emptyForm())
    },
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventory</h2>
          <p className="text-sm text-slate-500">Finished-goods products, ready for retail sale.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={15} /> New Product
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}

      {data && data.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          No products yet. Create one here, or push a packed production item into inventory from its Item Details
          page.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data?.data.map((product) => {
          const totalStock = (product.variants ?? []).reduce((sum, v) => sum + Number(v.stock_quantity), 0)
          const prices = (product.variants ?? []).map((v) => Number(v.price)).filter((p) => p > 0)
          const priceLabel =
            prices.length === 0
              ? '—'
              : Math.min(...prices) === Math.max(...prices)
                ? `₹${Math.min(...prices).toLocaleString('en-IN')}`
                : `₹${Math.min(...prices).toLocaleString('en-IN')} – ₹${Math.max(...prices).toLocaleString('en-IN')}`

          return (
            <Link
              key={product.id}
              to={`/inventory/products/${product.id}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Package size={18} />
                </span>
                <Badge value={product.status} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                <p className="text-xs text-slate-400">{product.brand?.name ?? 'No brand'}</p>
              </div>
              <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                <span>
                  {product.variants_count ?? 0} variant{(product.variants_count ?? 0) === 1 ? '' : 's'}
                </span>
                <span>{totalStock} in stock</span>
              </div>
              <p className="text-sm font-semibold text-brand-700">{priceLabel}</p>
            </Link>
          )
        })}
      </div>

      {data && data.last_page > 1 && (
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= data.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && (
        <Modal title="New Product" onClose={() => setModalOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate()
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <input
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.brand_id}
                  onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                >
                  <option value="">Select…</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Garment Type</label>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.garment_type}
                  onChange={(e) => setForm({ ...form, garment_type: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">HSN Code</label>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.hsn_code}
                  onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving…' : 'Save Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
