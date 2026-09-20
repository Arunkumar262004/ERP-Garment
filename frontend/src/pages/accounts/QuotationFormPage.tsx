import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'
import type { Contact, Paginated, Quotation } from '../../types'
import ItemsEditor from '../../components/ItemsEditor'

const STATUS_OPTIONS = ['draft', 'sent', 'accepted', 'rejected', 'expired']

const emptyItem = { description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount: 0, tax_percent: 18 }

interface QuotationFormState {
  contact_id: string
  quotation_date: string
  valid_until: string
  status: string
  notes: string
  items: Record<string, unknown>[]
}

function emptyForm(): QuotationFormState {
  return {
    contact_id: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: '',
    status: 'draft',
    notes: '',
    items: [{ ...emptyItem }],
  }
}

interface LineTotals {
  subtotal: number
  discount: number
  tax: number
}

function lineTotals(items: Record<string, unknown>[]): LineTotals {
  return items.reduce<LineTotals>(
    (acc, i) => {
      const base = Number(i.quantity || 0) * Number(i.unit_price || 0) - Number(i.discount || 0)
      acc.subtotal += Number(i.quantity || 0) * Number(i.unit_price || 0)
      acc.discount += Number(i.discount || 0)
      acc.tax += (base * Number(i.tax_percent || 0)) / 100
      return acc
    },
    { subtotal: 0, discount: 0, tax: 0 },
  )
}

export default function QuotationFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm())

  const { data: editing } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => (await api.get<Quotation>(`/quotations/${id}`)).data,
    enabled: isEditing,
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: async () => (await api.get<Paginated<Contact>>('/contacts', { params: { per_page: 100 } })).data.data,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        contact_id: String(editing.contact_id),
        quotation_date: editing.quotation_date.slice(0, 10),
        valid_until: editing.valid_until?.slice(0, 10) ?? '',
        status: editing.status,
        notes: editing.notes ?? '',
        items: editing.items?.length ? editing.items.map((i) => ({ ...i })) : [{ ...emptyItem }],
      })
    }
  }, [editing])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contact_id: form.contact_id,
        quotation_date: form.quotation_date,
        valid_until: form.valid_until || null,
        status: form.status,
        notes: form.notes,
        items: form.items.map((i) => ({
          ...i,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          discount: Number(i.discount || 0),
          tax_percent: Number(i.tax_percent),
        })),
      }
      if (isEditing) return api.put(`/quotations/${id}`, payload)
      return api.post('/quotations', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      navigate('/accounts/quotations')
    },
  })

  const contactOptions = (contacts ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
  const totals = lineTotals(form.items)
  const grandTotal = totals.subtotal - totals.discount + totals.tax

  return (
    <div>
      <Link
        to="/accounts/quotations"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {isEditing ? `Edit Quotation${editing ? ` — ${editing.quotation_no}` : ''}` : 'New Quotation'}
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate()
        }}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
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
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Line Items</label>
          <ItemsEditor
            columns={[
              { name: 'description', label: 'Description', type: 'text' },
              { name: 'quantity', label: 'Qty', type: 'number' },
              { name: 'unit', label: 'Unit', type: 'text' },
              { name: 'unit_price', label: 'Unit Price', type: 'number' },
              { name: 'discount', label: 'Discount (₹)', type: 'number' },
              { name: 'tax_percent', label: 'Tax %', type: 'number' },
            ]}
            items={form.items}
            onChange={(items) => setForm({ ...form, items })}
            emptyItem={emptyItem}
          />
        </div>

        <div className="flex flex-col items-end gap-1 text-sm text-slate-600">
          <div>Subtotal: ₹{totals.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          <div>Discount: ₹{totals.discount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          <div>Tax: ₹{totals.tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          <div className="text-base font-semibold text-slate-800">
            Estimated Total: ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
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
          <Link
            to="/accounts/quotations"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Quotation'}
          </button>
        </div>
      </form>
    </div>
  )
}
