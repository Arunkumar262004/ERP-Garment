import { useEffect, useState } from 'react'
import type { FieldConfig, SelectOption } from './types'

export default function ResourceForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  fields: FieldConfig[]
  initialValues: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, SelectOption[]>>({})

  useEffect(() => {
    fields.forEach((field) => {
      if (field.loadOptions) {
        field.loadOptions().then((opts) => {
          setDynamicOptions((prev) => ({ ...prev, [field.name]: opts }))
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => {
          const options = field.loadOptions ? dynamicOptions[field.name] ?? [] : field.options ?? []
          const value = values[field.name] ?? ''

          return (
            <div key={field.name} className={field.span === 2 ? 'col-span-2' : 'col-span-1'}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  rows={3}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={value as string}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  required={field.required}
                  value={value as string}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={value as string}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
