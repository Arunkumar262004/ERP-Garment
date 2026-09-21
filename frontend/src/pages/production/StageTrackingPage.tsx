import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Package, Pencil, Truck, ArrowLeft, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, ProductionOrder, ProductionProcess } from '../../types'
import Badge from '../../components/Badge'
import DownloadMenu from '../../components/DownloadMenu'
import ActionButton from '../../components/ActionButton'
import { exportToCsv, type ExportColumn } from '../../lib/exportCsv'
import { exportToPdf } from '../../lib/exportPdf'
import MoveStageModal from '../../components/production/MoveStageModal'
import { useToast } from '../../components/ToastProvider'

const STAGE_LABELS: Record<string, string> = {
  dyeing: 'Dyeing',
  printing: 'Printing',
  cutting: 'Cutting',
  stitching: 'Stitching',
  packing: 'Packing',
  quality_check: 'Quality Check',
}

const TARGET_STAGES = ['dyeing', 'printing', 'cutting', 'stitching', 'packing', 'quality_check']
const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'skipped']
const ACTIVE_STATUSES = ['pending', 'in_progress']

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'order_no', label: 'Order No' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
]

function orderSizes(order?: ProductionOrder): string {
  const names = Array.from(new Set((order?.items ?? []).map((i) => i.size?.name).filter(Boolean))) as string[]
  return names.length ? names.join(', ') : '—'
}

function DueDate({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>

  const due = new Date(value.slice(0, 10))
  const today = new Date(new Date().toDateString())
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  const dotClass = diffDays < 0 ? 'bg-red-500' : diffDays <= 3 ? 'bg-amber-500' : 'bg-slate-300'
  const textClass = diffDays < 0 ? 'text-red-600' : diffDays <= 3 ? 'text-amber-700' : 'text-slate-600'

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {value.slice(0, 10)}
    </span>
  )
}

export default function StageTrackingPage() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [quickOptionOpen, setQuickOptionOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const label = type ? (STAGE_LABELS[type] ?? type) : ''

  const { data, isLoading } = useQuery({
    queryKey: ['production-processes', type, status, page],
    queryFn: async () =>
      (
        await api.get<Paginated<ProductionProcess>>('/production-processes', {
          params: { process_type: type, status: STATUS_OPTIONS.includes(status) ? status : undefined, page },
        })
      ).data,
  })

  const invalidate = () => {
    setSelectedIds([])
    queryClient.invalidateQueries({ queryKey: ['production-processes'] })
    queryClient.invalidateQueries({ queryKey: ['production-process-stage-counts'] })
    queryClient.invalidateQueries({ queryKey: ['deliveries'] })
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/production-processes/${id}`, { status }),
    onSuccess: invalidate,
  })

  const markDeliveredMutation = useMutation({
    mutationFn: (id: number) => api.post(`/production-processes/${id}/mark-delivered`),
    onSuccess: () => {
      invalidate()
      if (confirm('Order marked delivered and moved to the Delivery section. Open Delivery now?')) {
        navigate('/delivery')
      }
    },
  })

  const bulkMoveMutation = useMutation({
    mutationFn: (target: string) =>
      api.post<{ targets: { production_order_id: number; production_process_id: number }[] }>(
        '/production-processes/bulk-move',
        { process_ids: selectedIds, target_process_type: target }
      ),
    onSuccess: (res, target) => {
      invalidate()
      setQuickOptionOpen(false)
      const targets = res.data.targets
      if (targets.length === 1) {
        navigate(`/production/orders/${targets[0].production_order_id}/processes/${targets[0].production_process_id}/edit`)
      } else {
        navigate(`/production/stage/${target}`)
      }
    },
  })

  const rows = status === '' ? (data?.data ?? []).filter((r) => ACTIVE_STATUSES.includes(r.status)) : data?.data ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))

  const toggleAll = () => setSelectedIds(allSelected ? [] : rows.map((r) => r.id))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const exportRows = (subset: ProductionProcess[]) =>
    subset.map((p) => ({
      order_no: p.production_order?.order_no ?? '',
      customer: p.production_order?.contact?.name ?? '',
      status: p.status,
    }))

  const handleExportCsv = () => {
    const subset = selectedIds.length ? rows.filter((r) => selectedIds.includes(r.id)) : rows
    exportToCsv(`${type}-processes`, EXPORT_COLUMNS, exportRows(subset))
  }

  const handleExportPdf = () => {
    const subset = selectedIds.length ? rows.filter((r) => selectedIds.includes(r.id)) : rows
    exportToPdf({
      title: `${label} — Process Tracking`,
      filename: `${type}-processes`,
      sections: [{ columns: EXPORT_COLUMNS, rows: exportRows(subset) }],
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/production" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={15} /> Back
        </Link>
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
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-700">{label} — Process Tracking</p>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs"
            >
              <option value="">Active Only (default)</option>
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <DownloadMenu onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="w-8 px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2">Order No</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Sizes</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Due Date</th>
              <th className="px-3 py-2">Update Status</th>
              <th className="px-3 py-2 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  No orders at this stage.
                </td>
              </tr>
            )}
            {rows.map((proc) => (
              <tr key={proc.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selectedIds.includes(proc.id)} onChange={() => toggleOne(proc.id)} />
                </td>
                <td className="px-3 py-2 font-medium text-slate-700">{proc.production_order?.order_no}</td>
                <td className="px-3 py-2">{proc.production_order?.contact?.name}</td>
                <td className="px-3 py-2 text-slate-600">{orderSizes(proc.production_order)}</td>
                <td className="px-3 py-2">
                  <Badge value={proc.status} />
                </td>
                <td className="px-3 py-2">
                  <DueDate value={proc.due_date} />
                </td>
                <td className="px-3 py-2">
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
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      icon={Pencil}
                      label="Edit"
                      variant="edit"
                      title="Edit process, due date and item details"
                      to={`/production/orders/${proc.production_order_id}/processes/${proc.id}/edit`}
                    />
                    {proc.status === 'completed' && (
                      <ActionButton
                        icon={Package}
                        label="Move to Product"
                        variant="success"
                        title="Review items and push them into retail Inventory — nothing moves until you confirm there"
                        to={`/production/orders/${proc.production_order_id}/items?focus=push`}
                      />
                    )}
                    {proc.process_type === 'quality_check' && proc.status !== 'completed' && (
                      <ActionButton
                        icon={Truck}
                        label="Mark Delivered"
                        variant="success"
                        title="Complete quality check and send to Delivery"
                        disabled={markDeliveredMutation.isPending}
                        onClick={() => markDeliveredMutation.mutate(proc.id)}
                      />
                    )}
                    {proc.process_type === 'quality_check' && proc.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 size={13} /> Sent to Delivery
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.last_page > 1 && (
          <div className="mt-3 flex justify-end gap-2 text-sm">
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

      {quickOptionOpen && (
        <MoveStageModal
          count={selectedIds.length}
          options={TARGET_STAGES.filter((t) => t !== type).map((t) => ({ value: t, label: STAGE_LABELS[t] }))}
          onConfirm={(target) => bulkMoveMutation.mutate(target)}
          onClose={() => setQuickOptionOpen(false)}
          submitting={bulkMoveMutation.isPending}
        />
      )}
    </div>
  )
}
