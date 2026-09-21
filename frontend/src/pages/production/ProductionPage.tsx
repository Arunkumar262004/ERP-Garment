import type { CSSProperties } from 'react'
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

// Categorical hues, assigned in fixed pipeline order (never cycled/re-picked
// per tile) — validated for adjacent CVD/normal-vision separation. Used only
// as icon/badge fills and thin accents, never as text color, since three of
// these hues (aqua, yellow, magenta) fall below 3:1 against a white surface —
// every tile still carries its label in plain dark ink so identity never
// depends on the hue alone.
const STAGE_META: { type: string; label: string; icon: LucideIcon; hue: string }[] = [
  { type: 'dyeing', label: 'Dyeing', icon: Droplets, hue: '#2a78d6' },
  { type: 'printing', label: 'Printing', icon: Printer, hue: '#eb6834' },
  { type: 'cutting', label: 'Cutting', icon: Scissors, hue: '#1baf7a' },
  { type: 'stitching', label: 'Stitching', icon: Shirt, hue: '#eda100' },
  { type: 'packing', label: 'Packing', icon: Package, hue: '#e87ba4' },
  { type: 'quality_check', label: 'Quality Check', icon: CheckCircle2, hue: '#008300' },
]

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function StageTile({
  to,
  label,
  sublabel,
  value,
  icon: Icon,
  hue,
  meterFraction,
}: {
  to: string
  label: string
  sublabel: string
  value: number | string
  icon: LucideIcon
  hue: string
  meterFraction?: number
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--tile-hue)] hover:shadow-lg"
      style={{ '--tile-hue': hexToRgba(hue, 0.4) } as CSSProperties}
    >
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08] transition-transform duration-300 group-hover:scale-125"
        style={{ background: hue }}
      />

      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
        style={{ background: `linear-gradient(135deg, ${hue}, ${hexToRgba(hue, 0.75)})` }}
      >
        <Icon size={22} className="text-white" />
      </span>

      <span className="relative">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          <span className="text-xs font-medium text-slate-400">{sublabel}</span>
        </span>
      </span>

      {meterFraction !== undefined && (
        <span className="relative mt-auto block h-1.5 w-full overflow-hidden rounded-full" style={{ background: hexToRgba(hue, 0.15) }}>
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round(meterFraction * 100)}%`, background: hue }}
          />
        </span>
      )}
    </Link>
  )
}

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

  const activeByStage = STAGE_META.map((meta) => {
    const count = counts?.find((c) => c.process_type === meta.type)
    return (count?.pending ?? 0) + (count?.in_progress ?? 0)
  })
  const maxActive = Math.max(1, ...activeByStage)

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Production Pipeline</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select a stage to open its dedicated page. Counts show orders currently active there (pending + in
          progress) — once an order moves on, it no longer counts against the stage it left. The bar under each stage
          shows its load relative to the busiest stage right now.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StageTile
          to="/production/orders"
          label="Orders"
          sublabel="total"
          value={orders?.total ?? '—'}
          icon={ClipboardList}
          hue="#0b0b0b"
        />

        {STAGE_META.map((meta, i) => (
          <StageTile
            key={meta.type}
            to={`/production/stage/${meta.type}`}
            label={meta.label}
            sublabel="active"
            value={activeByStage[i]}
            icon={meta.icon}
            hue={meta.hue}
            meterFraction={activeByStage[i] / maxActive}
          />
        ))}
      </div>
    </div>
  )
}
