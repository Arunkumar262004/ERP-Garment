import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Download, FileText, Pencil, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, Quotation } from '../../types'
import { exportToPdf } from '../../lib/exportPdf'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'

export default function QuotationsPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page],
    queryFn: async () => (await api.get<Paginated<Quotation>>('/quotations', { params: { page } })).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quotations'] })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/quotations/${id}`),
    onSuccess: invalidate,
  })

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
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
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
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      icon={Download}
                      label="Download"
                      variant="neutral"
                      title="Download quotation as PDF"
                      onClick={() => downloadQuotation(q)}
                    />
                    <ActionButton
                      icon={FileText}
                      label="Create Invoice"
                      variant="success"
                      title="Create an invoice pre-filled from this quotation"
                      to={`/accounts/invoices/new?from_quotation=${q.id}`}
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
    </div>
  )
}
