import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Download, FileText, Pencil, Shirt, Trash2, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, Quotation } from '../../types'
import { exportToPdf } from '../../lib/exportPdf'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'
import Modal from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'

export default function QuotationsPage() {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [quickOptionOpen, setQuickOptionOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page],
    queryFn: async () => (await api.get<Paginated<Quotation>>('/quotations', { params: { page } })).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quotations'] })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/quotations/${id}`),
    onSuccess: invalidate,
  })

  const rows = data?.data ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))
  const toggleAll = () => setSelectedIds(allSelected ? [] : rows.map((r) => r.id))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const selectedRows = rows.filter((r) => selectedIds.includes(r.id))
  const allSelectedApproved = selectedRows.length > 0 && selectedRows.every((r) => r.status === 'approved')

  // The quotations LIST doesn't eager-load `items` — fetch each full quotation
  // before creating from it, same fix as InvoiceFormPage's applyQuotation.
  const bulkCreateInvoicesMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        selectedIds.map(async (qid) => {
          const full = (await api.get<Quotation>(`/quotations/${qid}`)).data
          return api.post('/invoices', {
            contact_id: full.contact_id,
            quotation_id: full.id,
            invoice_date: new Date().toISOString().slice(0, 10),
            status: 'draft',
            notes: full.notes,
            items: (full.items ?? []).map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              unit_price: i.unit_price,
              discount: i.discount ?? 0,
              tax_percent: i.tax_percent,
            })),
          })
        })
      ),
    onSuccess: () => {
      showToast(`Created ${selectedIds.length} invoice${selectedIds.length > 1 ? 's' : ''}`, 'success')
      setSelectedIds([])
      setQuickOptionOpen(false)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate('/accounts/invoices')
    },
    onError: () => showToast('Could not create invoices', 'error'),
  })

  const bulkCreateProductionOrdersMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        selectedIds.map(async (qid) => {
          const full = (await api.get<Quotation>(`/quotations/${qid}`)).data
          return api.post('/production-orders', {
            contact_id: full.contact_id,
            quotation_id: full.id,
            order_date: new Date().toISOString().slice(0, 10),
            notes: full.notes,
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

  const bulkBusy = bulkCreateInvoicesMutation.isPending || bulkCreateProductionOrdersMutation.isPending

  const downloadQuotation = async (q: Quotation) => {
    const full = (await api.get<Quotation>(`/quotations/${q.id}`)).data
    exportToPdf({
      title: `Quotation — ${full.quotation_no}`,
      subtitle: `Customer: ${full.contact?.name ?? '—'} · Date: ${full.quotation_date.slice(0, 10)} · Status: ${full.status}`,
      filename: full.quotation_no,
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
      ],
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          onClick={() => {
            if (selectedIds.length === 0) {
              showToast('Please select at least one quotation', 'error')
              return
            }
            setQuickOptionOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          <Zap size={15} /> Quick Option{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </button>
        <Link
          to="/accounts/quotations/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Quotation
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="w-8 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
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
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.data.map((q) => (
              <tr key={q.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleOne(q.id)} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{q.quotation_no}</td>
                <td className="px-4 py-3">{q.contact?.name}</td>
                <td className="px-4 py-3">{q.quotation_date?.slice(0, 10)}</td>
                <td className="px-4 py-3">₹{Number(q.total).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Badge value={q.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      icon={Download}
                      label="Download"
                      variant="neutral"
                      title="Download quotation as PDF"
                      onClick={() => downloadQuotation(q)}
                    />
                    <ActionButton icon={Pencil} label="Edit" variant="edit" to={`/accounts/quotations/${q.id}/edit`} />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      variant="delete"
                      onClick={() => confirm('Delete this quotation?') && deleteMutation.mutate(q.id)}
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
        <Modal title={`Quick Option — ${selectedIds.length} quotation(s) selected`} onClose={() => setQuickOptionOpen(false)}>
          <div className="space-y-3">
            <button
              onClick={() => bulkCreateInvoicesMutation.mutate()}
              disabled={bulkBusy}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              <FileText size={18} className="shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-medium text-slate-800">Create Invoices</span>
                <span className="block text-xs text-slate-500">
                  Creates one invoice per selected quotation, pre-filled with its customer and line items.
                </span>
              </span>
            </button>
            <button
              onClick={() => bulkCreateProductionOrdersMutation.mutate()}
              disabled={bulkBusy || !allSelectedApproved}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              <Shirt size={18} className="shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-medium text-slate-800">Create Production Orders</span>
                <span className="block text-xs text-slate-500">
                  {allSelectedApproved
                    ? 'Creates one production order per selected quotation, pre-filled with its customer and items.'
                    : 'All selected quotations must be Approved to create production orders.'}
                </span>
              </span>
            </button>
            {bulkBusy && <p className="text-center text-xs text-slate-400">Working…</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
