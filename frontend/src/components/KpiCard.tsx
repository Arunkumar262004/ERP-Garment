import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'

export default function KpiCard({
  icon: Icon,
  iconClass,
  label,
  value,
  change,
  changeLabel,
  note,
}: {
  icon: LucideIcon
  iconClass: string
  label: string
  value: string
  change?: number | null
  changeLabel?: string
  note?: string
}) {
  const hasChange = change !== undefined && change !== null
  const isUp = (change ?? 0) >= 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-xl font-bold text-slate-800">{value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon size={20} className="text-white" />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {hasChange ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                isUp ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(change as number)}%
            </span>
            {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
          </>
        ) : (
          note && <span className="text-xs text-slate-400">{note}</span>
        )}
      </div>
    </div>
  )
}
