import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Paginated, ProductionProcess } from '../../types'
import Badge from '../../components/Badge'

const PROCESS_TYPES = ['cutting', 'stitching', 'printing', 'washing', 'packing', 'quality_check', 'other']
const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'skipped']

export default function ProcessesPage() {
  const [processType, setProcessType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['production-processes', processType, status, page],
    queryFn: async () =>
      (
        await api.get<Paginated<ProductionProcess>>('/production-processes', {
          params: { process_type: processType || undefined, status: status || undefined, page },
        })
      ).data,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/production-processes/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production-processes'] }),
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={processType}
          onChange={(e) => {
            setProcessType(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Process Types</option>
          {PROCESS_TYPES.map((p) => (
            <option key={p} value={p}>
              {p.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Order No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Process</th>
              <th className="px-4 py-3">Sequence</th>
              <th className="px-4 py-3">Qty Completed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Update Status</th>
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
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No process records found.
                </td>
              </tr>
            )}
            {data?.data.map((proc) => (
              <tr key={proc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{proc.production_order?.order_no}</td>
                <td className="px-4 py-3">{proc.production_order?.contact?.name}</td>
                <td className="px-4 py-3 capitalize">{proc.process_type.replace('_', ' ')}</td>
                <td className="px-4 py-3">{proc.sequence}</td>
                <td className="px-4 py-3">{proc.quantity_completed}</td>
                <td className="px-4 py-3">
                  <Badge value={proc.status} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={proc.status}
                    onChange={(e) => updateMutation.mutate({ id: proc.id, status: e.target.value })}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
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
