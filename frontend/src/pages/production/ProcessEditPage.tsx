import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'
import type { ProductionOrder } from '../../types'

const STAGE_LABELS: Record<string, string> = {
  dyeing: 'Dyeing',
  printing: 'Printing',
  cutting: 'Cutting',
  stitching: 'Stitching',
  packing: 'Packing',
  quality_check: 'Quality Check',
  other: 'Other',
}

interface AssigneeOption {
  id: number
  name: string
  role: string
}

export default function ProcessEditPage() {
  const { orderId, processId } = useParams<{ orderId: string; processId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['production-order', orderId],
    queryFn: async () => (await api.get<ProductionOrder>(`/production-orders/${orderId}`)).data,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AssigneeOption[]>('/users')).data,
  })

  const process = order?.processes?.find((p) => String(p.id) === processId)

  const [form, setForm] = useState({
    assigned_to: '',
    quantity_completed: 0,
    start_date: '',
    end_date: '',
    remarks: '',
  })

  useEffect(() => {
    if (process) {
      setForm({
        assigned_to: process.assigned_to ? String(process.assigned_to) : '',
        quantity_completed: process.quantity_completed,
        start_date: process.start_date?.slice(0, 10) ?? '',
        end_date: process.end_date?.slice(0, 10) ?? '',
        remarks: process.remarks ?? '',
      })
    }
  }, [process])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/production-processes/${processId}`, {
        assigned_to: form.assigned_to || null,
        quantity_completed: Number(form.quantity_completed),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        remarks: form.remarks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-processes'] })
      queryClient.invalidateQueries({ queryKey: ['production-process-stage-counts'] })
      queryClient.invalidateQueries({ queryKey: ['production-order', orderId] })
      navigate(process ? `/production/stage/${process.process_type}` : '/production')
    },
  })

  const backTo = process ? `/production/stage/${process.process_type}` : '/production'

  return (
    <div>
      <Link to={backTo} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          Edit {process ? (STAGE_LABELS[process.process_type] ?? process.process_type) : 'Process'}
          {order ? ` — ${order.order_no}` : ''}
        </h2>
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}
      {!isLoading && !process && <p className="text-slate-400">Process not found.</p>}

      {process && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            >
              <option value="">Unassigned</option>
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantity Completed</label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.quantity_completed}
              onChange={(e) => setForm({ ...form, quantity_completed: Number(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              to={backTo}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
