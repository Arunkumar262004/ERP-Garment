import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { api } from '../../api/client'
import type { Contact, Paginated, ProductionOrder, Size } from '../../types'
import { sanitizeNonNegativeInput } from '../../lib/validation'
import { useToast } from '../../components/ToastProvider'
import LoadingOverlay from '../../components/LoadingOverlay'

interface ItemFormValue {
  item_name: string
  quantity: number
  sku: string
  size_id: number | null
  color: string
  gsm: string
  dia: string
  counts: string
}

const STAGE_LABELS: Record<string, string> = {
  knitting: 'Knitting',
  dyeing: 'Dyeing',
  compacting: 'Compacting',
  printing: 'Printing',
  cutting: 'Cutting',
  stitching: 'Stitching',
  packing: 'Packing',
  quality_check: 'Quality Check',
  other: 'Other',
}

const FABRIC_FIELD_STAGES = ['dyeing', 'printing', 'compacting']

interface AssigneeOption {
  id: number
  name: string
  role: string
}

export default function ProcessEditPage() {
  const { orderId, processId } = useParams<{ orderId: string; processId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['production-order', orderId],
    queryFn: async () => (await api.get<ProductionOrder>(`/production-orders/${orderId}`)).data,
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AssigneeOption[]>('/users')).data,
  })

  const { data: sizes } = useQuery({
    queryKey: ['sizes'],
    queryFn: async () => (await api.get<Paginated<Size>>('/sizes', { params: { status: 'active' } })).data.data,
  })

  const process = order?.processes?.find((p) => String(p.id) === processId)

  useEffect(() => {
    if (process && process.status === 'completed') {
      showToast('This stage is already completed and locked', 'error')
      navigate(`/production/stage/${process.process_type}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process?.id, process?.status])

  const { data: categoryEmployees } = useQuery({
    queryKey: ['employees-by-category', process?.process_type],
    queryFn: async () =>
      (
        await api.get<Paginated<Contact>>('/contacts', {
          params: { type: 'employee', category: process!.process_type, status: 'active', per_page: 100 },
        })
      ).data.data,
    enabled: !!process,
  })

  const orderedProcesses = [...(order?.processes ?? [])].sort((a, b) => a.sequence - b.sequence)
  const previousProcess = process
    ? [...orderedProcesses].reverse().find((p) => p.sequence < process.sequence)
    : undefined

  const [form, setForm] = useState({
    assigned_to: '',
    assigned_employee_id: '',
    quantity_completed: 0,
    start_date: '',
    end_date: '',
    due_date: '',
    remarks: '',
  })
  const [employeeError, setEmployeeError] = useState<string | null>(null)
  const [dueDateError, setDueDateError] = useState<string | null>(null)
  const [itemsForm, setItemsForm] = useState<Record<number, ItemFormValue>>({})

  useEffect(() => {
    if (process) {
      setForm({
        assigned_to: process.assigned_to ? String(process.assigned_to) : '',
        assigned_employee_id: process.assigned_employee_id ? String(process.assigned_employee_id) : '',
        quantity_completed: process.quantity_completed,
        start_date: process.start_date?.slice(0, 10) ?? '',
        end_date: process.end_date?.slice(0, 10) ?? '',
        due_date: process.due_date?.slice(0, 10) ?? '',
        remarks: process.remarks ?? '',
      })
    }
  }, [process])

  useEffect(() => {
    if (order?.items) {
      setItemsForm(
        Object.fromEntries(
          order.items.map((item) => [
            item.id!,
            {
              item_name: item.item_name,
              quantity: item.quantity,
              sku: item.sku ?? '',
              size_id: item.size_id ?? null,
              color: item.color ?? '',
              gsm: item.gsm != null ? String(item.gsm) : '',
              dia: item.dia != null ? String(item.dia) : '',
              counts: item.counts ?? '',
            },
          ])
        )
      )
    }
  }, [order])

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/production-processes/${processId}`, {
        assigned_to: form.assigned_to || null,
        assigned_employee_id: form.assigned_employee_id || null,
        quantity_completed: Number(form.quantity_completed),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        due_date: form.due_date || null,
        remarks: form.remarks,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-processes'] })
      queryClient.invalidateQueries({ queryKey: ['production-process-stage-counts'] })
      queryClient.invalidateQueries({ queryKey: ['production-order', orderId] })
    },
    onError: () => showToast('Could not save process details', 'error'),
  })

  const backTo = process ? `/production/stage/${process.process_type}` : '/production'

  const handleSaveAll = async () => {
    let blocked = false

    if (!form.assigned_employee_id) {
      setEmployeeError(
        (categoryEmployees ?? []).length === 0
          ? 'No employees are set up for this category yet — add one first.'
          : 'Please assign an employee before saving.'
      )
      blocked = true
    } else {
      setEmployeeError(null)
    }

    if (!form.due_date) {
      setDueDateError('Please set a due date before saving.')
      blocked = true
    } else {
      setDueDateError(null)
    }

    if (blocked) return

    setSaving(true)
    try {
      await Promise.all([
        saveMutation.mutateAsync(),
        ...Object.entries(itemsForm).map(([itemId, values]) =>
          api.put(`/production-orders/${orderId}/items/${itemId}`, {
            item_name: values.item_name,
            quantity: Number(values.quantity),
            sku: values.sku || undefined,
            size_id: values.size_id || undefined,
            color: values.color || undefined,
            gsm: values.gsm !== '' ? Number(values.gsm) : null,
            dia: values.dia !== '' ? Number(values.dia) : null,
            counts: values.counts || undefined,
          })
        ),
      ])
      queryClient.invalidateQueries({ queryKey: ['production-order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['production-orders'] })
      showToast('Saved', 'success')
      navigate(process ? `/production/stage/${process.process_type}` : '/production')
    } catch {
      showToast('Could not save changes', 'error')
    } finally {
      setSaving(false)
    }
  }

  const isOverdue = !!(process?.due_date && process.status !== 'completed' && new Date(process.due_date.slice(0, 10)) < new Date(new Date().toDateString()))
  const showFabricFields = !!process && FABRIC_FIELD_STAGES.includes(process.process_type)
  const isCutting = process?.process_type === 'cutting'

  return (
    <div>
      {saving && <LoadingOverlay message="Saving…" />}

      <Link to={backTo} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          Edit {process ? (STAGE_LABELS[process.process_type] ?? process.process_type) : 'Process'}
          {order ? ` — ${order.order_no}` : ''}
        </h2>
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}
      {!isLoading && !process && <p className="text-slate-400">Process not found.</p>}
      {process && process.status === 'completed' && <p className="text-slate-400">This stage is completed and locked — redirecting…</p>}

      {process && order && process.status !== 'completed' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Process Summary</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400">Order No</p>
                <p className="text-sm font-medium text-slate-700">{order.order_no}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <p className="text-sm font-medium text-slate-700">{order.contact?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Stage</p>
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  {previousProcess ? (STAGE_LABELS[previousProcess.process_type] ?? previousProcess.process_type) : 'Order Created'}
                  <ArrowRight size={13} className="text-slate-400" />
                  <span className="text-brand-700">{STAGE_LABELS[process.process_type] ?? process.process_type}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Stage Changed On</p>
                <p className="text-sm font-medium text-slate-700">
                  {process.start_date ? process.start_date.slice(0, 10) : 'Not started yet'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Assigned Employee — {STAGE_LABELS[process.process_type] ?? process.process_type} team
                  <span className="text-red-500"> *</span>
                </label>
                <select
                  required
                  className={`w-full rounded-md border px-3 py-2 text-sm ${employeeError ? 'border-red-400' : 'border-slate-300'}`}
                  value={form.assigned_employee_id}
                  onChange={(e) => {
                    setForm({ ...form, assigned_employee_id: e.target.value })
                    if (e.target.value) setEmployeeError(null)
                  }}
                >
                  <option value="">Select…</option>
                  {(categoryEmployees ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.designation ? ` — ${c.designation}` : ''}
                    </option>
                  ))}
                </select>
                {employeeError ? (
                  <p className="mt-1 text-xs text-red-600">{employeeError}</p>
                ) : (
                  (categoryEmployees ?? []).length === 0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      No employees are set up for this category yet —{' '}
                      <Link to="/contacts/employees" className="font-medium text-brand-600 hover:underline">
                        add one under Contacts → Employees
                      </Link>
                      .
                    </p>
                  )
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To (System User)</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {(users ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {isCutting ? 'Cut Pcs Qty' : 'Quantity Completed'}
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.quantity_completed}
                  onChange={(e) => setForm({ ...form, quantity_completed: Number(sanitizeNonNegativeInput(e.target.value)) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Due Date<span className="text-red-500"> *</span>{' '}
                  {isOverdue && <span className="text-red-500">(overdue)</span>}
                </label>
                <input
                  type="date"
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    dueDateError || isOverdue ? 'border-red-400 bg-red-50' : 'border-slate-300'
                  }`}
                  value={form.due_date}
                  onChange={(e) => {
                    setForm({ ...form, due_date: e.target.value })
                    if (e.target.value) setDueDateError(null)
                  }}
                />
                {dueDateError && <p className="mt-1 text-xs text-red-600">{dueDateError}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Order Items</p>
            <p className="mb-3 text-xs text-slate-400">Changes here save together with the Save button below.</p>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item Name</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">SKU</th>
                    <th className="px-3 py-2 text-left font-medium">Size</th>
                    <th className="px-3 py-2 text-left font-medium">Color</th>
                    {showFabricFields && (
                      <>
                        <th className="px-3 py-2 text-left font-medium">GSM</th>
                        <th className="px-3 py-2 text-left font-medium">Dia</th>
                        <th className="px-3 py-2 text-left font-medium">Counts</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items ?? []).map((item) => {
                    const values =
                      itemsForm[item.id!] ??
                      ({
                        item_name: item.item_name,
                        quantity: item.quantity,
                        sku: '',
                        size_id: null,
                        color: '',
                        gsm: '',
                        dia: '',
                        counts: '',
                      } as ItemFormValue)
                    const update = (patch: Partial<ItemFormValue>) =>
                      setItemsForm((prev) => ({ ...prev, [item.id!]: { ...values, ...patch } }))
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-full min-w-[160px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={values.item_name}
                            onChange={(e) => update({ item_name: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            className="w-full min-w-[100px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={values.quantity}
                            onChange={(e) => update({ quantity: Number(sanitizeNonNegativeInput(e.target.value)) })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            placeholder="Auto if blank"
                            className="w-full min-w-[100px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={values.sku}
                            onChange={(e) => update({ sku: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full min-w-[140px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={values.size_id ?? ''}
                            onChange={(e) => update({ size_id: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="">Select…</option>
                            {(sizes ?? []).map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className="w-full min-w-[100px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                            value={values.color}
                            onChange={(e) => update({ color: e.target.value })}
                          />
                        </td>
                        {showFabricFields && (
                          <>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                className="w-full min-w-[80px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                value={values.gsm}
                                onChange={(e) => update({ gsm: sanitizeNonNegativeInput(e.target.value) })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                className="w-full min-w-[80px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                value={values.dia}
                                onChange={(e) => update({ dia: sanitizeNonNegativeInput(e.target.value) })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                className="w-full min-w-[100px] rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                                value={values.counts}
                                onChange={(e) => update({ counts: e.target.value })}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                  {(order.items ?? []).length === 0 && (
                    <tr>
                      <td colSpan={showFabricFields ? 8 : 5} className="px-3 py-2 text-slate-400">
                        No items on this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Link
              to={backTo}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
