import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'
import type { Contact, Lead, Paginated } from '../../types'
import { firstZodError, nonNegativeNumberSchema, phoneSchema, sanitizeNonNegativeInput, sanitizePhoneInput } from '../../lib/validation'

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

interface AssigneeOption {
  id: number
  name: string
  role: string
}

interface LeadFormState {
  name: string
  company_name: string
  email: string
  phone: string
  contact_id: string
  source: string
  status: string
  expected_value: number | string
  expected_close_date: string
  assigned_to: string
  follow_up_date: string
  notes: string
}

function emptyForm(): LeadFormState {
  return {
    name: '',
    company_name: '',
    email: '',
    phone: '',
    contact_id: '',
    source: 'other',
    status: 'new',
    expected_value: '',
    expected_close_date: '',
    assigned_to: '',
    follow_up_date: '',
    notes: '',
  }
}

export default function LeadFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: editing } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => (await api.get<Lead>(`/leads/${id}`)).data,
    enabled: isEditing,
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-b2b'],
    queryFn: async () =>
      (await api.get<Paginated<Contact>>('/contacts', { params: { type: 'b2b', per_page: 100 } })).data.data,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AssigneeOption[]>('/users')).data,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        company_name: editing.company_name ?? '',
        email: editing.email ?? '',
        phone: editing.phone ?? '',
        contact_id: editing.contact_id ? String(editing.contact_id) : '',
        source: editing.source,
        status: editing.status,
        expected_value: editing.expected_value ?? '',
        expected_close_date: editing.expected_close_date?.slice(0, 10) ?? '',
        assigned_to: editing.assigned_to ? String(editing.assigned_to) : '',
        follow_up_date: editing.follow_up_date?.slice(0, 10) ?? '',
        notes: editing.notes ?? '',
      })
    }
  }, [editing])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        contact_id: form.contact_id || null,
        source: form.source,
        status: form.status,
        expected_value: form.expected_value === '' ? 0 : Number(form.expected_value),
        expected_close_date: form.expected_close_date || null,
        assigned_to: form.assigned_to || null,
        follow_up_date: form.follow_up_date || null,
        notes: form.notes,
      }
      if (isEditing) return api.put(`/leads/${id}`, payload)
      return api.post('/leads', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      navigate('/crm/leads')
    },
  })

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    const phoneError = firstZodError(phoneSchema, form.phone)
    if (phoneError) nextErrors.phone = phoneError
    const valueError = firstZodError(nonNegativeNumberSchema('Expected Value'), form.expected_value)
    if (valueError) nextErrors.expected_value = valueError
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const contactOptions = (contacts ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.company_name ?? c.code})` }))
  const assigneeOptions = (users ?? []).map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))

  return (
    <div>
      <Link to="/crm/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {isEditing ? `Edit Lead${editing ? ` — ${editing.lead_no}` : ''}` : 'New Lead'}
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!validate()) return
          saveMutation.mutate()
        }}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <input
              type="text"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className={`w-full rounded-md border px-3 py-2 text-sm ${errors.phone ? 'border-red-400' : 'border-slate-300'}`}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Linked Contact (B2B)</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.contact_id}
              onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
            >
              <option value="">Select…</option>
              {contactOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Source</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected Value (₹)</label>
            <input
              type="number"
              min={0}
              className={`w-full rounded-md border px-3 py-2 text-sm ${errors.expected_value ? 'border-red-400' : 'border-slate-300'}`}
              value={form.expected_value}
              onChange={(e) => setForm({ ...form, expected_value: sanitizeNonNegativeInput(e.target.value) })}
            />
            {errors.expected_value && <p className="mt-1 text-xs text-red-600">{errors.expected_value}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected Close Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.expected_close_date}
              onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Follow-up Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.follow_up_date}
              onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link
            to="/crm/leads"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
