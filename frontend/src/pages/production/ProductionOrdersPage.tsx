import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Pencil, Trash2, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, ProductionOrder } from '../../types'
import { exportToPdf } from '../../lib/exportPdf'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'
import MoveStageModal from '../../components/production/MoveStageModal'
import { useToast } from '../../components/ToastProvider'
import LoadingOverlay from '../../components/LoadingOverlay'

const STAGE_ORDER = ['knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check']
const STAGE_LABELS: Record<string, string> = {
  knitting: 'Knitting',
  dyeing: 'Dyeing',
  compacting: 'Compacting',
  printing: 'Printing',
  cutting: 'Cutting',
  stitching: 'Stitching',
  packing: 'Packing',
  quality_check: 'Quality Check',
}

function currentStageLabel(order: ProductionOrder): string {
  if (order.status === 'cancelled') return 'Cancelled'
  if (order.status === 'delivered') return 'Delivered'
  const processes = order.processes ?? []
  if (processes.length === 0) return '—'
  const active = processes.find((p) => p.status !== 'completed' && p.status !== 'skipped')
  return active ? (STAGE_LABELS[active.process_type] ?? active.process_type) : 'Completed'
}

export default function ProductionOrdersPage() {
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [quickOptionOpen, setQuickOptionOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['production-orders', page],
    queryFn: async () =>
      (await api.get<Paginated<ProductionOrder>>('/production-orders', { params: { page } })).data,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['production-orders'] })
    queryClient.invalidateQueries({ queryKey: ['production-process-stage-counts'] })
  }

  const bulkMoveMutation = useMutation({
    mutationFn: (target: string) =>
      api.post<{ targets: { production_order_id: number; production_process_id: number }[] }>(
        '/production-processes/bulk-move',
        { production_order_ids: selectedIds, target_process_type: target }
      ),
    onSuccess: (res, target) => {
      invalidate()
      setSelectedIds([])
      setQuickOptionOpen(false)
      const targets = res.data.targets
      if (targets.length === 1) {
        navigate(`/production/orders/${targets[0].production_order_id}/processes/${targets[0].production_process_id}/edit`)
      } else {
        navigate(`/production/stage/${target}`)
      }
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not move the selected order(s) — please check their status.'
      showToast(message, 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/production-orders/${id}`),
    onSuccess: invalidate,
  })

  const exportProcessSheet = async (order: ProductionOrder) => {
    const full = (await api.get<ProductionOrder>(`/production-orders/${order.id}`)).data
    exportToPdf({
      title: `Process Sheet — ${full.order_no}`,
      subtitle: `Customer: ${full.contact?.name ?? '—'} · Order Date: ${full.order_date.slice(0, 10)} · Status: ${full.status.replace('_', ' ')}`,
      filename: `${full.order_no}-process-sheet`,
      sections: [
        {
          heading: 'Materials Used',
          columns: [
            { key: 'name', label: 'Raw Material' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'unit', label: 'Unit' },
          ],
          rows: (full.materials ?? []).map((m) => ({
            name: m.rawMaterial?.name ?? '—',
            quantity: m.quantity,
            unit: m.unit ?? '',
          })),
        },
        {
          heading: 'Process Pipeline',
          columns: [
            { key: 'sequence', label: '#' },
            { key: 'process_type', label: 'Process' },
            { key: 'status', label: 'Status' },
            { key: 'start_date', label: 'Start' },
            { key: 'end_date', label: 'End' },
          ],
          rows: (full.processes ?? []).map((p) => ({
            sequence: p.sequence,
            process_type: p.process_type,
            status: p.status,
            start_date: p.start_date?.slice(0, 10) ?? '—',
            end_date: p.end_date?.slice(0, 10) ?? '—',
          })),
        },
      ],
    })
  }

  const rows = data?.data ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))
  const toggleAll = () => setSelectedIds(allSelected ? [] : rows.map((r) => r.id))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  return (
    <div>
      {bulkMoveMutation.isPending && <LoadingOverlay message="Moving selected order(s)…" />}

      <div className="mb-4 flex items-center justify-between">
        <Link to="/production" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} /> Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                showToast('Please select at least one order', 'error')
                return
              }
              setQuickOptionOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            <Zap size={15} /> Quick Option{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </button>
          <Link
            to="/production/orders/new"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New Production Order
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="w-8 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3">Order No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Order Type</th>
              <th className="px-4 py-3">Current Stage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleOne(o.id)} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{o.order_no}</td>
                <td className="px-4 py-3">{o.contact?.name}</td>
                <td className="px-4 py-3">{o.total_quantity}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.order_type === 'others' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    {o.order_type === 'others' ? 'Others' : 'Own'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{currentStageLabel(o)}</td>
                <td className="px-4 py-3">
                  <Badge value={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      icon={Download}
                      label="Sheet"
                      variant="neutral"
                      title="Export process sheet as PDF"
                      onClick={() => exportProcessSheet(o)}
                    />
                    <ActionButton
                      icon={Pencil}
                      label="Edit"
                      variant="edit"
                      to={`/production/orders/${o.id}/edit`}
                      disabled={o.status === 'completed'}
                      title={o.status === 'completed' ? 'Completed orders are locked' : undefined}
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      variant="delete"
                      onClick={() => confirm('Delete this production order?') && deleteMutation.mutate(o.id)}
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
        <MoveStageModal
          count={selectedIds.length}
          options={STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
          onConfirm={(target) => bulkMoveMutation.mutate(target)}
          onClose={() => setQuickOptionOpen(false)}
          submitting={bulkMoveMutation.isPending}
        />
      )}
    </div>
  )
}
