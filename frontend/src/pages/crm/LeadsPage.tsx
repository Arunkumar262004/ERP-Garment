import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, Pencil, Trash2, UserCheck, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { Lead, Paginated } from '../../types'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'
import { useToast } from '../../components/ToastProvider'
import ConfirmModal from '../../components/ConfirmModal'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

function FollowUp({ date }: { date: string | null }) {
  if (!date) return <span className="text-slate-400">—</span>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const followUp = new Date(date)
  followUp.setHours(0, 0, 0, 0)
  const diffDays = Math.round((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let dotClass = 'bg-slate-300'
  let textClass = 'text-slate-600'
  if (diffDays < 0) {
    dotClass = 'bg-red-500'
    textClass = 'text-red-600 font-medium'
  } else if (diffDays <= 3) {
    dotClass = 'bg-amber-500'
    textClass = 'text-amber-600 font-medium'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${textClass}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      {date.slice(0, 10)}
    </span>
  )
}

export default function LeadsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false)
  const [convertType, setConvertType] = useState<'b2b' | 'b2c'>('b2b')
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads', page, search, status],
    queryFn: async () =>
      (
        await api.get<Paginated<Lead>>('/leads', {
          params: { page, search: search || undefined, status: status || undefined },
        })
      ).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leads'] })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/leads/${id}`),
    onSuccess: invalidate,
  })

  const convertMutation = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map((id) => api.post(`/leads/${id}/convert`, { type: convertType }))),
    onSuccess: (_res, ids) => {
      showToast(`Converted ${ids.length} lead${ids.length > 1 ? 's' : ''} to customer${ids.length > 1 ? 's' : ''}`, 'success')
      setSelectedIds([])
      setConfirmConvertOpen(false)
      invalidate()
    },
    onError: () => showToast('Could not convert the selected lead(s)', 'error'),
  })

  const rows = data?.data ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))
  const toggleAll = () => setSelectedIds(allSelected ? [] : rows.map((r) => r.id))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const handleConvert = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one lead', 'error')
      return
    }
    // Smart default: if any selected lead has a company name, suggest B2B — but the user picks explicitly.
    const anyHasCompany = rows.some((r) => selectedIds.includes(r.id) && !!r.company_name)
    setConvertType(anyHasCompany ? 'b2b' : 'b2c')
    setConfirmConvertOpen(true)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleConvert}
            disabled={convertMutation.isPending}
            className="flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
          >
            <UserCheck size={15} />
            {convertMutation.isPending ? 'Converting…' : `Convert to Customer${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
          </button>
          <Link
            to="/crm/leads/capture"
            className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            title="Quick capture with auto-assignment"
          >
            <Zap size={15} /> Quick Capture
          </Link>
          <Link
            to="/crm/leads/new"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + New Lead
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
              <th className="px-4 py-3">Lead No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expected Value</th>
              <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-red-500">
                  Failed to load data.
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            )}
            {data?.data.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    disabled={!!lead.contact_id}
                    title={lead.contact_id ? 'Already converted to a customer' : undefined}
                    onChange={() => toggleOne(lead.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{lead.lead_no}</td>
                <td className="px-4 py-3">
                  {lead.name}
                  {lead.contact_id && (
                    <span className="ml-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Customer
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{lead.company_name ?? '—'}</td>
                <td className="px-4 py-3">{lead.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge value={lead.source} />
                </td>
                <td className="px-4 py-3">
                  <Badge value={lead.status} />
                </td>
                <td className="px-4 py-3">₹{Number(lead.expected_value).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <FollowUp date={lead.follow_up_date} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton
                      icon={FileText}
                      label="Create Quotation"
                      variant="success"
                      title="Create a quotation pre-filled from this lead"
                      to={`/accounts/quotations/new?from_lead=${lead.id}`}
                    />
                    <ActionButton icon={Pencil} label="Edit" variant="edit" to={`/crm/leads/${lead.id}/edit`} />
                    <ActionButton icon={Trash2} label="Delete" variant="delete" onClick={() => setDeleteTarget(lead)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.current_page} of {data.last_page} · {data.total} records
          </span>
          <div className="flex gap-2">
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
        </div>
      )}

      {confirmConvertOpen && (
        <ConfirmModal
          title="Convert to Customer"
          message={`Convert ${selectedIds.length} selected lead(s) to a Customer? This creates a customer contact for each and marks the lead Won.`}
          confirmLabel="Convert"
          submitting={convertMutation.isPending}
          onConfirm={() => convertMutation.mutate(selectedIds)}
          onClose={() => setConfirmConvertOpen(false)}
        >
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Customer Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="radio" checked={convertType === 'b2b'} onChange={() => setConvertType('b2b')} />
              B2B Customer
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="radio" checked={convertType === 'b2c'} onChange={() => setConvertType('b2c')} />
              B2C Customer
            </label>
          </div>
        </ConfirmModal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Lead"
          message={`Delete lead "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          submitting={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
