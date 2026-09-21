import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle2 } from 'lucide-react'
import { API_BASE_URL } from '../../api/client'
import { firstZodError, phoneSchema, sanitizePhoneInput } from '../../lib/validation'

const INTEREST_OPTIONS = [
  { value: 'healthcare_erp', label: 'Healthcare ERP' },
  { value: 'basic_crm', label: 'Basic CRM' },
  { value: 'automation_crm', label: 'Automation CRM' },
  { value: 'general', label: 'General / Not sure yet' },
]

interface InquiryFormState {
  name: string
  company_name: string
  email: string
  phone: string
  interest: string
  notes: string
}

function emptyForm(): InquiryFormState {
  return { name: '', company_name: '', email: '', phone: '', interest: '', notes: '' }
}

/**
 * Genuinely public, unauthenticated page — no ProtectedRoute, no MainLayout,
 * no bearer token. Posts straight to /public/inquiries with a plain axios
 * call (not the shared `api` client) so a 401/network error here never
 * triggers the shared client's redirect-to-/login interceptor, which would
 * be the wrong behavior for an anonymous visitor.
 */
export default function InquiryPage() {
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation({
    mutationFn: () =>
      axios.post<{ message: string }>(`${API_BASE_URL}/public/inquiries`, {
        name: form.name,
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        interest: form.interest || null,
        notes: form.notes || null,
      }),
    onSuccess: () => setSubmitted(true),
  })

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    const phoneError = firstZodError(phoneSchema, form.phone)
    if (phoneError) nextErrors.phone = phoneError
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500" />
          <h1 className="mb-1 text-lg font-bold text-slate-800">Thanks for reaching out!</h1>
          <p className="text-sm text-slate-500">
            We&apos;ve received your enquiry and someone from our team will be in touch shortly.
          </p>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm())
              setSubmitted(false)
            }}
            className="mt-6 text-sm font-medium text-brand-600 hover:underline"
          >
            Submit another enquiry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-brand-700">Garment ERP</h1>
        <p className="mb-6 text-sm text-slate-500">Tell us a bit about what you need and we&apos;ll get back to you.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!validate()) return
            submitMutation.mutate()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
                className={`w-full rounded-md border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none ${
                  errors.phone ? 'border-red-400' : 'border-slate-300'
                }`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">What are you interested in?</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INTEREST_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-2 text-center text-xs font-medium ${
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {submitMutation.isError && (
            <p className="text-sm text-red-600">Something went wrong — please try again in a moment.</p>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Sending…' : 'Send Enquiry'}
          </button>
        </form>
      </div>
    </div>
  )
}
