import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Paginated } from '../../types'
import Modal from '../Modal'
import ResourceForm from './ResourceForm'
import type { ResourceConfig } from './types'

export default function ResourcePage<T extends { id: number }>({ config }: { config: ResourceConfig<T> }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const queryClient = useQueryClient()

  const queryKey = [config.queryKey, page, search, config.extraParams]

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get<Paginated<T>>(config.endpoint, {
        params: { page, search: search || undefined, ...config.extraParams },
      })
      return res.data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [config.queryKey] })

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.post(config.endpoint, { ...values, ...config.extraParams }),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.put(`${config.endpoint}/${editing?.id}`, values),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${config.endpoint}/${id}`),
    onSuccess: () => invalidate(),
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: T) => {
    setEditing(row)
    setModalOpen(true)
  }

  const handleDelete = (row: T) => {
    if (confirm('Delete this record? This cannot be undone.')) {
      deleteMutation.mutate(row.id)
    }
  }

  const initialValues: Record<string, unknown> = editing
    ? Object.fromEntries(config.fields.map((f) => [f.name, (editing as Record<string, unknown>)[f.name] ?? '']))
    : Object.fromEntries(config.fields.map((f) => [f.name, f.defaultValue ?? '']))

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder={config.searchPlaceholder ?? 'Search…'}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={openCreate}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add New
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {config.columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-6 text-center text-red-500">
                  Failed to load data.
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-6 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            )}
            {data?.data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {config.columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  {config.allowEdit !== false && (
                    <button onClick={() => openEdit(row)} className="mr-3 text-brand-600 hover:underline">
                      Edit
                    </button>
                  )}
                  <button onClick={() => handleDelete(row)} className="text-red-600 hover:underline">
                    Delete
                  </button>
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
        <Modal title={editing ? `Edit ${config.title}` : `Add ${config.title}`} onClose={() => setModalOpen(false)}>
          <ResourceForm
            fields={config.fields}
            initialValues={initialValues}
            submitting={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setModalOpen(false)}
            onSubmit={(values) => (editing ? updateMutation.mutate(values) : createMutation.mutate(values))}
          />
        </Modal>
      )}
    </div>
  )
}
