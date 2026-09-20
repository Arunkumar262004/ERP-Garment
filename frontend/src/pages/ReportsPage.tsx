import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import StatCard from '../components/StatCard'

const REPORTS = [
  { key: 'orders', label: 'Order Report' },
  { key: 'b2b', label: 'B2B Report' },
  { key: 'b2c', label: 'B2C Report' },
  { key: 'crm', label: 'CRM Report' },
  { key: 'production', label: 'Production Report' },
  { key: 'purchase', label: 'Purchase Report' },
  { key: 'accounts', label: 'Accounts Report' },
  { key: 'delivery', label: 'Delivery Report' },
]

function humanize(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }
  return String(value ?? '—')
}

function SummaryGrid({ summary }: { summary: Record<string, unknown> }) {
  const scalarEntries = Object.entries(summary).filter(([, v]) => typeof v !== 'object' || v === null)
  const objectEntries = Object.entries(summary).filter(([, v]) => typeof v === 'object' && v !== null)

  return (
    <div className="space-y-6">
      {scalarEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {scalarEntries.map(([key, value]) => (
            <StatCard key={key} label={humanize(key)} value={formatValue(value)} />
          ))}
        </div>
      )}
      {objectEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {objectEntries.map(([key, value]) => (
            <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{humanize(key)}</p>
              <div className="space-y-1">
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-500">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-slate-800">{formatValue(v)}</span>
                  </div>
                ))}
                {Object.keys(value as Record<string, unknown>).length === 0 && (
                  <p className="text-sm text-slate-400">No data</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [active, setActive] = useState('orders')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['report', active, from, to],
    queryFn: async () =>
      (
        await api.get<{ summary: Record<string, unknown> }>(`/reports/${active}`, {
          params: { from: from || undefined, to: to || undefined },
        })
      ).data,
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active === r.key ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {isLoading && <div className="text-slate-400">Loading report…</div>}
      {data && <SummaryGrid summary={data.summary} />}
    </div>
  )
}
