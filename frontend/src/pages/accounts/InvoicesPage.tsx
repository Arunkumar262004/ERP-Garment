import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Download, Pencil, Shirt, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import type { Invoice, Paginated } from '../../types'
import { exportToPdf } from '../../lib/exportPdf'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

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

  return (
    <div>
      <div className="mb-4 flex justify-end">
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
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.data.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
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
                    <ActionButton
                      icon={Shirt}
                      label="Create Production Order"
                      variant="success"
                      title="Create a production order pre-filled from this invoice"
                      to={`/production/orders/new?from_invoice=${inv.id}`}
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
    </div>
  )
}
