const COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-500',
  pending: 'bg-amber-50 text-amber-700',
  new: 'bg-sky-50 text-sky-700',
  contacted: 'bg-sky-50 text-sky-700',
  qualified: 'bg-indigo-50 text-indigo-700',
  proposal: 'bg-indigo-50 text-indigo-700',
  negotiation: 'bg-purple-50 text-purple-700',
  won: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-700',
  draft: 'bg-slate-100 text-slate-500',
  sent: 'bg-sky-50 text-sky-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-slate-100 text-slate-500',
  paid: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-700',
  ordered: 'bg-sky-50 text-sky-700',
  partially_received: 'bg-amber-50 text-amber-700',
  received: 'bg-emerald-50 text-emerald-700',
  in_production: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-amber-50 text-amber-700',
  skipped: 'bg-slate-100 text-slate-500',
  dispatched: 'bg-sky-50 text-sky-700',
  returned: 'bg-red-50 text-red-700',
}

export default function Badge({ value }: { value: string }) {
  const cls = COLORS[value] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}
