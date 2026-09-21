import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import type { Role } from '../../types'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import ActionButton from '../../components/ActionButton'
import Modal from '../../components/Modal'
import Toggle from '../../components/Toggle'
import { MODULE_TREE } from '../../lib/modules'

interface RoleFormState {
  name: string
  permissions: string[]
}

function emptyForm(): RoleFormState {
  return { name: '', permissions: [] }
}

export default function RolesPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [form, setForm] = useState<RoleFormState>(emptyForm())

  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get<Role[]>('/admin/roles')).data,
    enabled: currentUser?.role === 'admin',
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
    queryClient.invalidateQueries({ queryKey: ['admin-roles-all'] })
  }

  const createMutation = useMutation({
    mutationFn: (values: RoleFormState) => api.post('/admin/roles', values),
    onSuccess: () => {
      showToast('Role saved', 'success')
      invalidate()
      setModalOpen(false)
    },
    onError: () => showToast('Failed to save role', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: RoleFormState }) => api.put(`/admin/roles/${id}`, values),
    onSuccess: () => {
      showToast('Role saved', 'success')
      invalidate()
      setModalOpen(false)
    },
    onError: () => showToast('Failed to save role', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      showToast('Role deleted', 'success')
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

  const openEdit = (role: Role) => {
    setEditing(role)
    setForm({ name: role.name, permissions: role.permissions ?? [] })
    setModalOpen(true)
  }

  const toggleModule = (key: string, children: string[]) => {
    const allKeys = [key, ...children]
    const allOn = allKeys.every((k) => form.permissions.includes(k))
    setForm((prev) => ({
      ...prev,
      permissions: allOn
        ? prev.permissions.filter((p) => !allKeys.includes(p))
        : Array.from(new Set([...prev.permissions, ...allKeys])),
    }))
  }

  const toggleItem = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing.id, values: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Roles</h2>
          <p className="text-sm text-slate-500">Define which modules each role can see and use.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Role
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="px-4 py-3">Role Name</th>
              <th className="px-4 py-3">Modules</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && (roles ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No roles yet.
                </td>
              </tr>
            )}
            {roles?.map((role) => (
              <tr key={role.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{role.name}</td>
                <td className="px-4 py-3 text-slate-500">{(role.permissions ?? []).length} module(s)</td>
                <td className="px-4 py-3 text-slate-500">{role.users_count ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton icon={Pencil} label="Edit" variant="edit" onClick={() => openEdit(role)} />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      variant="delete"
                      onClick={() => confirm(`Delete role "${role.name}"? Users with this role keep their account but lose these module permissions.`) && deleteMutation.mutate(role.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Role' : 'Add Role'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role Name<span className="text-red-500"> *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cutting Supervisor"
                className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Modules</p>
              <div className="max-h-[50vh] space-y-1 overflow-y-auto rounded-md border border-slate-200 p-3">
                {MODULE_TREE.map((group) => {
                  const childKeys = group.items?.map((i) => i.key) ?? []
                  const groupChecked = [group.key, ...childKeys].every((k) => form.permissions.includes(k))

                  return (
                    <div key={group.key} className="py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">{group.label}</span>
                        <Toggle checked={groupChecked} onChange={() => toggleModule(group.key, childKeys)} />
                      </div>
                      {group.items && (
                        <div className="mt-1.5 ml-4 space-y-1.5 border-l border-slate-100 pl-3">
                          {group.items.map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">{item.label}</span>
                              <Toggle checked={form.permissions.includes(item.key)} onChange={() => toggleItem(item.key)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
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
