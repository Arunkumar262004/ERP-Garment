import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'
import { api } from '../../api/client'
import type { Lead } from '../../types'
import { firstZodError, phoneSchema, sanitizePhoneInput } from '../../lib/validation'
import { useToast } from '../../components/ToastProvider'

const INTEREST_OPTIONS = [
  { value: 'healthcare_erp', label: 'Healthcare ERP' },
  { value: 'basic_crm', label: 'Basic CRM' },
  { value: 'automation_crm', label: 'Automation CRM' },
  { value: 'general', label: 'General / Not sure yet' },
]

interface CaptureFormState {
  name: string
  company_name: string
  email: string
  phone: string
  interest: string
  notes: string
}

function emptyForm(): CaptureFormState {
  return { name: '', company_name: '', email: '', phone: '', interest: '', notes: '' }
}

export default function LeadCapturePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const captureMutation = useMutation({
    mutationFn: () =>
      api.post<Lead>('/leads/quick-capture', {
        name: form.name,
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        interest: form.interest || null,
        notes: form.notes || null,
      }),
    onSuccess: (res) => {
      const lead = res.data
      const assigneeName = lead.assignee?.name
      showToast(
        assigneeName
          ? `Lead ${lead.lead_no} created and assigned to ${assigneeName}`
          : `Lead ${lead.lead_no} created — no matching sales user was available to assign`,
        'success'
      )
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      navigate('/crm/leads')
    },
    onError: () => showToast('Could not create the lead', 'error'),
  })

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    const phoneError = firstZodError(phoneSchema, form.phone)
    if (phoneError) nextErrors.phone = phoneError
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  return (
    <div>
      <Link to="/crm/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">Quick Capture — New Enquiry</h2>
        <p className="text-sm text-slate-500">
          Log an enquiry you received by phone, email or walk-in. Pick what they&apos;re interested in and it&apos;s
          automatically assigned to whichever matching sales specialist currently has the fewest open leads — and a
          follow-up is scheduled for 2 days from now.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!validate()) return
          captureMutation.mutate()
        }}
        className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Interested In</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INTEREST_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  form.interest === o.value
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={form.interest === o.value}
                  onChange={() => setForm({ ...form, interest: o.value })}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            rows={3}
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
            disabled={captureMutation.isPending}
            className="flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Zap size={15} />
            {captureMutation.isPending ? 'Capturing…' : 'Capture & Auto-Assign'}
          </button>
        </div>
      </form>
    </div>
  )
}
