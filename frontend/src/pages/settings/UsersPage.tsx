import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Power, PowerOff } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, Role, User } from '../../types'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'
import Modal from '../../components/Modal'
import { sanitizePhoneInput } from '../../lib/validation'

const ROLE_OPTIONS = ['admin', 'sales', 'accounts', 'production', 'purchase', 'crm', 'viewer']

const SPECIALIZATION_OPTIONS = [
  { value: 'healthcare_erp', label: 'Healthcare ERP' },
  { value: 'basic_crm', label: 'Basic CRM' },
  { value: 'automation_crm', label: 'Automation CRM' },
  { value: 'general', label: 'General' },
]

interface UserFormState {
  name: string
  email: string
  phone: string
  password: string
  role: string
  role_id: string
  specialization: string
  is_active: boolean
}

function emptyForm(): UserFormState {
  return { name: '', email: '', phone: '', password: '', role: 'sales', role_id: '', specialization: '', is_active: true }
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm())

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, search, role, status],
    queryFn: async () =>
      (
        await api.get<Paginated<User>>('/admin/users', {
          params: { page, search: search || undefined, role: role || undefined, status: status || undefined },
        })
      ).data,
    enabled: currentUser?.role === 'admin',
  })

  const { data: roles } = useQuery({
    queryKey: ['admin-roles-all'],
    queryFn: async () => (await api.get<Role[]>('/admin/roles')).data,
    enabled: currentUser?.role === 'admin',
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const createMutation = useMutation({
    mutationFn: (values: UserFormState) => api.post('/admin/users', values),
    onSuccess: () => {
      showToast('User saved', 'success')
      invalidate()
      setModalOpen(false)
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message ?? 'Failed to save user', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<UserFormState> }) => api.put(`/admin/users/${id}`, values),
    onSuccess: () => {
      showToast('User saved', 'success')
      invalidate()
      setModalOpen(false)
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(message ?? 'Failed to save user', 'error')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      showToast('User deactivated', 'success')
      invalidate()
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => api.put(`/admin/users/${id}`, { is_active: true }),
    onSuccess: () => {
      showToast('User activated', 'success')
      invalidate()
    },
  })

  if (currentUser?.role !== 'admin') {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
        Access restricted to administrators.
      </div>
    )
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (row: User) => {
    setEditing(row)
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone ?? '',
      password: '',
      role: row.role,
      role_id: row.role_id ? String(row.role_id) : '',
      specialization: row.specialization ?? '',
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      role_id: form.role_id || null,
      specialization: form.specialization || null,
    } as unknown as UserFormState
    if (editing) {
      const values: Partial<UserFormState> = {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        role_id: payload.role_id,
        specialization: payload.specialization,
        is_active: payload.is_active,
      }
      if (form.password) values.password = form.password
      updateMutation.mutate({ id: editing.id, values })
    } else {
      createMutation.mutate(payload)
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add User
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-500">
                  Failed to load data.
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            )}
            {data?.data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                <td className="px-4 py-3">{row.email}</td>
                <td className="px-4 py-3">
                  <Badge value={row.role} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton icon={Pencil} label="Edit" variant="edit" onClick={() => openEdit(row)} />
                    {row.is_active ? (
                      <ActionButton
                        icon={PowerOff}
                        label="Deactivate"
                        variant="delete"
                        onClick={() => confirm('Deactivate this user?') && deactivateMutation.mutate(row.id)}
                      />
                    ) : (
                      <ActionButton
                        icon={Power}
                        label="Activate"
                        variant="success"
                        onClick={() => activateMutation.mutate(row.id)}
                      />
                    )}
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

      {modalOpen && (
        <Modal title={editing ? 'Edit User' : 'Add User'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name<span className="text-red-500"> *</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email<span className="text-red-500"> *</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone (for WhatsApp updates)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {editing ? 'New Password (leave blank to keep current)' : 'Password'}
                  {!editing && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="password"
                  required={!editing}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Access Role (permissions)</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                >
                  <option value="">None (see everything)</option>
                  {(roles ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Specialization</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                >
                  <option value="">Not set</option>
                  {SPECIALIZATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Used to auto-route quick-captured leads to the least-busy matching specialist.
                </p>
              </div>
              <div className="col-span-2 flex items-end">
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
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
        </Modal>
      )}
    </div>
  )
}
