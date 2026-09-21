import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'
import type { Contact, Invoice, Paginated, Product, Quotation } from '../../types'
import ItemsEditor from '../../components/ItemsEditor'
import { validateLineItems } from '../../lib/validation'

const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']

const emptyItem = { description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount: 0, tax_percent: 18 }

interface InvoiceFormState {
  contact_id: string
  quotation_id: string
  invoice_date: string
  due_date: string
  status: string
  notes: string
  items: Record<string, unknown>[]
}

function emptyForm(): InvoiceFormState {
  return {
    contact_id: '',
    quotation_id: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: '',
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

export default function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const [searchParams] = useSearchParams()
  const fromQuotationParam = searchParams.get('from_quotation')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)

  const { data: editing } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get<Invoice>(`/invoices/${id}`)).data,
    enabled: isEditing,
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: async () => (await api.get<Paginated<Contact>>('/contacts', { params: { per_page: 100 } })).data.data,
  })

  const { data: quotations } = useQuery({
    queryKey: ['quotations-all'],
    queryFn: async () => (await api.get<Paginated<Quotation>>('/quotations', { params: { per_page: 100 } })).data.data,
    enabled: !isEditing,
  })

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { per_page: 100 } })).data.data,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        contact_id: String(editing.contact_id),
        quotation_id: editing.quotation_id ? String(editing.quotation_id) : '',
        invoice_date: editing.invoice_date.slice(0, 10),
        due_date: editing.due_date?.slice(0, 10) ?? '',
        status: editing.status,
        notes: editing.notes ?? '',
        items: editing.items?.length ? editing.items.map((i) => ({ ...i })) : [{ ...emptyItem }],
      })
    }
  }, [editing])

  // The quotations LIST (`GET /quotations`) only eager-loads `contact`, not
  // `items` — so applying it directly would silently leave line items empty.
  // Fetch the single quotation (`GET /quotations/{id}`), which does load items.
  const applyQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => (await api.get<Quotation>(`/quotations/${quotationId}`)).data,
    onSuccess: (quotation) => {
      setForm((f) => ({
        ...f,
        quotation_id: String(quotation.id),
        contact_id: String(quotation.contact_id),
        notes: quotation.notes ?? f.notes,
        items: quotation.items?.length
          ? quotation.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              unit_price: i.unit_price,
              discount: i.discount ?? 0,
              tax_percent: i.tax_percent,
            }))
          : f.items,
      }))
    },
  })

  const applyQuotation = (quotationId: string) => {
    if (!quotationId) {
      setForm((f) => ({ ...f, quotation_id: '' }))
      return
    }
    applyQuotationMutation.mutate(quotationId)
  }

  useEffect(() => {
    if (!isEditing && fromQuotationParam) {
      applyQuotation(fromQuotationParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, fromQuotationParam])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contact_id: form.contact_id,
        quotation_id: form.quotation_id || null,
        invoice_date: form.invoice_date,
        due_date: form.due_date || null,
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
      if (isEditing) return api.put(`/invoices/${id}`, payload)
      return api.post('/invoices', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/accounts/invoices')
    },
  })

  const contactOptions = (contacts ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
  const variantOptions = (products ?? []).flatMap((p) =>
    (p.variants ?? []).map((v) => ({
      value: v.id,
      label: `${p.name}${v.size?.name ? ` — ${v.size.name}` : ''}${v.color ? ` — ${v.color}` : ''} (${v.sku}) · Stock ${v.stock_quantity}`,
    })),
  )
  const quotationOptions = (quotations ?? []).map((q) => ({
    value: q.id,
    label: `${q.quotation_no} — ${q.contact?.name ?? ''} (₹${Number(q.total).toLocaleString('en-IN')})`,
  }))

  const totals = lineTotals(form.items)
  const grandTotal = totals.subtotal - totals.discount + totals.tax

  return (
    <div>
      <Link
        to="/accounts/invoices"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {isEditing ? `Edit Invoice${editing ? ` — ${editing.invoice_no}` : ''}` : 'New Invoice'}
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const error = validateLineItems(form.items)
          if (error) {
            setFormError(error)
            return
          }
          setFormError(null)
          saveMutation.mutate()
        }}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        {formError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
        )}
        {!isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Load from Quotation (optional)</label>
            <select
              className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.quotation_id}
              onChange={(e) => applyQuotation(e.target.value)}
            >
              <option value="">Select…</option>
              {quotationOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              {applyQuotationMutation.isPending
                ? 'Loading quotation items…'
                : 'Fills in the customer and line items from that quotation automatically — you can still edit them below.'}
            </p>
          </div>
        )}

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
            <label className="mb-1 block text-sm font-medium text-slate-700">Invoice Date *</label>
            <input
              type="date"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
              { name: 'product_variant_id', label: 'Product (Inventory)', type: 'select', options: variantOptions },
            ]}
            items={form.items}
            onChange={(items) => setForm({ ...form, items })}
            emptyItem={emptyItem}
          />
          <p className="mt-1 text-xs text-slate-400">
            Link a line to a Product from Inventory to sell it retail — its stock is reduced by the quantity billed
            when this invoice is saved.
          </p>
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
            to="/accounts/invoices"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  )
}
