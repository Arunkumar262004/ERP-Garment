import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Contact, Paginated, Quotation } from '../../types'
import Modal from '../../components/Modal'
import ItemsEditor from '../../components/ItemsEditor'
import Badge from '../../components/Badge'

const STATUS_OPTIONS = ['draft', 'sent', 'accepted', 'rejected', 'expired']

const emptyItem = { description: '', quantity: 1, unit: 'pcs', unit_price: 0, tax_percent: 18 }

interface QuotationFormState {
  contact_id: string
  quotation_date: string
  valid_until: string
  status: string
  discount: number
  notes: string
  items: Record<string, unknown>[]
}

function emptyForm(): QuotationFormState {
  return {
    contact_id: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: '',
    status: 'draft',
    discount: 0,
    notes: '',
    items: [{ ...emptyItem }],
  }
}

export default function QuotationsPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [form, setForm] = useState(emptyForm())
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page],
    queryFn: async () => (await api.get<Paginated<Quotation>>('/quotations', { params: { page } })).data,
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: async () => (await api.get<Paginated<Contact>>('/contacts', { params: { per_page: 100 } })).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quotations'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), tax_percent: Number(i.tax_percent) })) }
      if (editing) return api.put(`/quotations/${editing.id}`, payload)
      return api.post('/quotations', payload)
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/quotations/${id}`),
    onSuccess: invalidate,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        contact_id: String(editing.contact_id),
        quotation_date: editing.quotation_date.slice(0, 10),
        valid_until: editing.valid_until?.slice(0, 10) ?? '',
        status: editing.status,
        discount: editing.discount,
        notes: editing.notes ?? '',
        items: editing.items?.length ? editing.items.map((i) => ({ ...i })) : [{ ...emptyItem }],
      })
    } else {
      setForm(emptyForm())
    }
  }, [editing])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const total = form.items.reduce((sum, i) => {
    const line = Number(i.quantity || 0) * Number(i.unit_price || 0)
    return sum + line + (line * Number(i.tax_percent || 0)) / 100
  }, 0) - Number(form.discount || 0)

  const contactOptions = (contacts ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Quotation
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Quotation No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
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
            {data?.data.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{q.quotation_no}</td>
                <td className="px-4 py-3">{q.contact?.name}</td>
                <td className="px-4 py-3">{q.quotation_date?.slice(0, 10)}</td>
                <td className="px-4 py-3">₹{Number(q.total).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Badge value={q.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(q)
                      setModalOpen(true)
                    }}
                    className="mr-3 text-brand-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirm('Delete this quotation?') && deleteMutation.mutate(q.id)}
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
        <Modal title={editing ? 'Edit Quotation' : 'New Quotation'} onClose={() => setModalOpen(false)} wide>
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Quotation Date *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.quotation_date}
                  onChange={(e) => setForm({ ...form, quotation_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Valid Until</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
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
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Discount (₹)</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Line Items</label>
              <ItemsEditor
                columns={[
                  { name: 'description', label: 'Description', type: 'text' },
                  { name: 'quantity', label: 'Qty', type: 'number' },
                  { name: 'unit', label: 'Unit', type: 'text' },
                  { name: 'unit_price', label: 'Unit Price', type: 'number' },
                  { name: 'tax_percent', label: 'Tax %', type: 'number' },
                ]}
                items={form.items}
                onChange={(items) => setForm({ ...form, items })}
                emptyItem={emptyItem}
              />
            </div>

            <div className="flex justify-end text-sm font-medium text-slate-700">
              Estimated Total: ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>

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
                {saveMutation.isPending ? 'Saving…' : 'Save Quotation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
