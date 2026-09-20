import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardList,
  Droplets,
  Package,
  Printer,
  Scissors,
  Shirt,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, ProcessStageCount, ProductionOrder } from '../../types'

const STAGE_META: { type: string; label: string; icon: LucideIcon; color: string }[] = [
  { type: 'dyeing', label: 'Dyeing', icon: Droplets, color: 'bg-violet-500' },
  { type: 'printing', label: 'Printing', icon: Printer, color: 'bg-indigo-500' },
  { type: 'cutting', label: 'Cutting', icon: Scissors, color: 'bg-sky-500' },
  { type: 'stitching', label: 'Stitching', icon: Shirt, color: 'bg-amber-500' },
  { type: 'packing', label: 'Packing', icon: Package, color: 'bg-emerald-500' },
  { type: 'quality_check', label: 'Quality Check', icon: CheckCircle2, color: 'bg-rose-500' },
]

export default function ProductionPage() {
  const { data: counts } = useQuery({
    queryKey: ['production-process-stage-counts'],
    queryFn: async () => (await api.get<ProcessStageCount[]>('/production-processes/stage-counts')).data,
  })

  const { data: orders } = useQuery({
    queryKey: ['production-orders-count'],
    queryFn: async () =>
      (await api.get<Paginated<ProductionOrder>>('/production-orders', { params: { per_page: 1 } })).data,
  })

  return (
    <div>
      <p className="mb-4 text-xs text-slate-400">
        Select a box to open its dedicated page. Stage counts show orders currently active there (pending + in
        progress) — once an order moves on, it no longer counts against the stage it left.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Link
          to="/production/orders"
          className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-brand-200 hover:shadow-sm"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700">
            <ClipboardList size={20} className="text-white" />
          </span>
          <span className="text-sm font-semibold text-slate-700">Orders</span>
          <span className="text-xs text-slate-400">{orders?.total ?? '—'} total</span>
        </Link>

        {STAGE_META.map((meta) => {
          const count = counts?.find((c) => c.process_type === meta.type)
          const active = (count?.pending ?? 0) + (count?.in_progress ?? 0)
          const Icon = meta.icon

          return (
            <Link
              key={meta.type}
              to={`/production/stage/${meta.type}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-brand-200 hover:shadow-sm"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${meta.color}`}>
                <Icon size={20} className="text-white" />
              </span>
              <span className="text-sm font-semibold text-slate-700">{meta.label}</span>
              <span className="text-xs text-slate-400">{active} active</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
