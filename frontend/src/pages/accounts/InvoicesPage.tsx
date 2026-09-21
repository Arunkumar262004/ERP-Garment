import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Pencil, Shirt, Trash2, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { Invoice, Paginated } from '../../types'
import { exportToPdf } from '../../lib/exportPdf'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'
import Modal from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [quickOptionOpen, setQuickOptionOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: async () => (await api.get<Paginated<Invoice>>('/invoices', { params: { page } })).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['invoices'] })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/invoices/${id}`),
    onSuccess: invalidate,
  })

  const downloadInvoice = async (inv: Invoice) => {
    const full = (await api.get<Invoice>(`/invoices/${inv.id}`)).data
    exportToPdf({
      title: `Invoice — ${full.invoice_no}`,
      subtitle: `Customer: ${full.contact?.name ?? '—'} · Date: ${full.invoice_date.slice(0, 10)} · Status: ${full.status}`,
      filename: full.invoice_no,
      sections: [
        {
          columns: [
            { key: 'description', label: 'Description' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unit_price', label: 'Unit Price' },
            { key: 'discount', label: 'Discount' },
            { key: 'tax_percent', label: 'Tax %' },
            { key: 'total', label: 'Total' },
          ],
          rows: (full.items ?? []).map((i) => ({ ...i, discount: i.discount ?? 0 })),
        },
      ],
      totals: [
        { label: 'Subtotal', value: `₹${Number(full.subtotal).toLocaleString('en-IN')}` },
        { label: 'Discount', value: `₹${Number(full.discount).toLocaleString('en-IN')}` },
        { label: 'GST', value: `₹${Number(full.tax).toLocaleString('en-IN')}` },
        { label: 'Grand Total', value: `₹${Number(full.total).toLocaleString('en-IN')}`, emphasis: true },
        { label: 'Paid', value: `₹${Number(full.paid_amount).toLocaleString('en-IN')}` },
        { label: 'Balance Due', value: `₹${Number(full.balance_amount).toLocaleString('en-IN')}`, emphasis: true },
      ],
    })
  }

  const rows = data?.data ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))
  const toggleAll = () => setSelectedIds(allSelected ? [] : rows.map((r) => r.id))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  // The invoices LIST doesn't eager-load `items` — fetch each full invoice
  // before creating from it, same fix as InvoiceFormPage's applyQuotation.
  const bulkCreateProductionOrdersMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        selectedIds.map(async (id) => {
          const full = (await api.get<Invoice>(`/invoices/${id}`)).data
          return api.post('/production-orders', {
            contact_id: full.contact_id,
            invoice_id: full.id,
            quotation_id: full.quotation_id ?? undefined,
            order_date: new Date().toISOString().slice(0, 10),
            notes: `From invoice ${full.invoice_no}.`,
            items: (full.items ?? []).map((i) => ({
              item_name: i.description,
              description: '',
              quantity: i.quantity,
              unit: i.unit ?? 'pcs',
            })),
          })
        })
      ),
    onSuccess: () => {
      showToast(`Created ${selectedIds.length} production order${selectedIds.length > 1 ? 's' : ''}`, 'success')
      setSelectedIds([])
      setQuickOptionOpen(false)
      queryClient.invalidateQueries({ queryKey: ['production-orders'] })
      navigate('/production/orders')
    },
    onError: () => showToast('Could not create production orders', 'error'),
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          onClick={() => {
            if (selectedIds.length === 0) {
              showToast('Please select at least one invoice', 'error')
              return
            }
            setQuickOptionOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          <Zap size={15} /> Quick Option{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </button>
        <Link
          to="/accounts/invoices/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Invoice
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="w-8 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3">Invoice No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.data.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleOne(inv.id)} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{inv.invoice_no}</td>
                <td className="px-4 py-3">{inv.contact?.name}</td>
                <td className="px-4 py-3">₹{Number(inv.total).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">₹{Number(inv.balance_amount).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Badge value={inv.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      icon={Download}
                      label="Download"
                      variant="neutral"
                      title="Download invoice as PDF"
                      onClick={() => downloadInvoice(inv)}
                    />
                    <ActionButton icon={Pencil} label="Edit" variant="edit" to={`/accounts/invoices/${inv.id}/edit`} />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      variant="delete"
                      onClick={() => confirm('Delete this invoice?') && deleteMutation.mutate(inv.id)}
                    />
                  </div>
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

      {quickOptionOpen && (
        <Modal title={`Quick Option — ${selectedIds.length} invoice(s) selected`} onClose={() => setQuickOptionOpen(false)}>
          <div className="space-y-3">
            <button
              onClick={() => bulkCreateProductionOrdersMutation.mutate()}
              disabled={bulkCreateProductionOrdersMutation.isPending}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              <Shirt size={18} className="shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-medium text-slate-800">Create Production Orders</span>
                <span className="block text-xs text-slate-500">
                  Creates one production order per selected invoice, pre-filled with its customer and line items.
                </span>
              </span>
            </button>
            {bulkCreateProductionOrdersMutation.isPending && <p className="text-center text-xs text-slate-400">Working…</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
