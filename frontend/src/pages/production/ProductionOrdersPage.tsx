import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Contact, Paginated, ProductionOrder } from '../../types'
import Modal from '../../components/Modal'
import ItemsEditor from '../../components/ItemsEditor'
import Badge from '../../components/Badge'

const STATUS_OPTIONS = ['pending', 'in_production', 'completed', 'delivered', 'cancelled']
const PROCESS_OPTIONS = ['cutting', 'stitching', 'printing', 'washing', 'packing', 'quality_check']

interface ProductionOrderFormState {
  contact_id: string
  order_date: string
  expected_delivery_date: string
  status: string
  notes: string
  items: Record<string, unknown>[]
  processes: string[]
}

function emptyForm(): ProductionOrderFormState {
  return {
    contact_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    status: 'pending',
    notes: '',
    items: [{ item_name: '', description: '', quantity: 1, unit: 'pcs' }],
    processes: ['cutting', 'stitching', 'printing', 'washing', 'packing'],
  }
}

export default function ProductionOrdersPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductionOrder | null>(null)
  const [form, setForm] = useState(emptyForm())
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['production-orders', page],
    queryFn: async () =>
      (await api.get<Paginated<ProductionOrder>>('/production-orders', { params: { page } })).data,
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: async () => (await api.get<Paginated<Contact>>('/contacts', { params: { per_page: 100 } })).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['production-orders'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contact_id: form.contact_id,
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || null,
        status: form.status,
        notes: form.notes,
        items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
        ...(editing ? {} : { processes: form.processes }),
      }
      if (editing) return api.put(`/production-orders/${editing.id}`, payload)
      return api.post('/production-orders', payload)
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/production-orders/${id}`),
    onSuccess: invalidate,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        contact_id: String(editing.contact_id),
        order_date: editing.order_date.slice(0, 10),
        expected_delivery_date: editing.expected_delivery_date?.slice(0, 10) ?? '',
        status: editing.status,
        notes: editing.notes ?? '',
        items: editing.items?.length
          ? editing.items.map((i) => ({ ...i }))
          : [{ item_name: '', description: '', quantity: 1, unit: 'pcs' }],
        processes: [],
      })
    } else {
      setForm(emptyForm())
    }
  }, [editing])

  const toggleProcess = (proc: string) => {
    setForm((f) => ({
      ...f,
      processes: f.processes.includes(proc) ? f.processes.filter((p) => p !== proc) : [...f.processes, proc],
    }))
  }

  const contactOptions = (contacts ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Production Order
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Order No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Delivery Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.data.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{o.order_no}</td>
                <td className="px-4 py-3">{o.contact?.name}</td>
                <td className="px-4 py-3">{o.total_quantity}</td>
                <td className="px-4 py-3">{o.expected_delivery_date?.slice(0, 10) ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge value={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(o)
                      setModalOpen(true)
                    }}
                    className="mr-3 text-brand-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirm('Delete this production order?') && deleteMutation.mutate(o.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <Modal
          title={editing ? 'Edit Production Order' : 'New Production Order'}
          onClose={() => setModalOpen(false)}
          wide
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveMutation.mutate()
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer *</label>
                <select
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.contact_id}
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                >
                  <option value="">Select…</option>
                  {contactOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Order Date *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.order_date}
                  onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Expected Delivery</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.expected_delivery_date}
                  onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Order Items</label>
              <ItemsEditor
                columns={[
                  { name: 'item_name', label: 'Item Name', type: 'text' },
                  { name: 'description', label: 'Description', type: 'text' },
                  { name: 'quantity', label: 'Qty', type: 'number' },
                  { name: 'unit', label: 'Unit', type: 'text' },
                ]}
                items={form.items}
                onChange={(items) => setForm({ ...form, items })}
                emptyItem={{ item_name: '', description: '', quantity: 1, unit: 'pcs' }}
              />
            </div>

            {!editing && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Production Process Pipeline
                </label>
                <div className="flex flex-wrap gap-3">
                  {PROCESS_OPTIONS.map((proc) => (
                    <label key={proc} className="flex items-center gap-1.5 text-sm capitalize text-slate-600">
                      <input
                        type="checkbox"
                        checked={form.processes.includes(proc)}
                        onChange={() => toggleProcess(proc)}
                      />
                      {proc.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                disabled={saveMutation.isPending}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
