import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackageCheck, Pencil, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, PurchaseOrder, RawMaterial, Supplier } from '../../types'
import { useOpenCreateFromNav } from '../../hooks/useOpenCreateFromNav'
import Modal from '../../components/Modal'
import ItemsEditor from '../../components/ItemsEditor'
import { validateLineItems } from '../../lib/validation'
import Badge from '../../components/Badge'
import ActionButton from '../../components/ActionButton'

const STATUS_OPTIONS = ['draft', 'ordered', 'partially_received', 'received', 'cancelled']

interface PurchaseOrderFormState {
  supplier_id: string
  order_date: string
  expected_date: string
  status: string
  notes: string
  items: Record<string, unknown>[]
}

function emptyForm(): PurchaseOrderFormState {
  return {
    supplier_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_date: '',
    status: 'draft',
    notes: '',
    items: [{ raw_material_id: '', quantity: 1, unit_price: 0 }],
  }
}

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: async () => (await api.get<Paginated<PurchaseOrder>>('/purchase-orders', { params: { page } })).data,
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: async () => (await api.get<Paginated<Supplier>>('/suppliers', { params: { per_page: 100 } })).data.data,
  })

  const { data: rawMaterials } = useQuery({
    queryKey: ['raw-materials-all'],
    queryFn: async () =>
      (await api.get<Paginated<RawMaterial>>('/raw-materials', { params: { per_page: 100 } })).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        supplier_id: form.supplier_id,
        order_date: form.order_date,
        expected_date: form.expected_date || null,
        status: form.status,
        notes: form.notes,
        items: form.items.map((i) => ({
          raw_material_id: i.raw_material_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      }
      if (editing) return api.put(`/purchase-orders/${editing.id}`, payload)
      return api.post('/purchase-orders', payload)
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/purchase-orders/${id}`),
    onSuccess: invalidate,
  })

  const receiveMutation = useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      const items = (po.items ?? []).map((i) => ({
        purchase_order_item_id: i.id,
        received_quantity: i.quantity,
      }))
      return api.post(`/purchase-orders/${po.id}/receive`, { items })
    },
    onSuccess: invalidate,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        supplier_id: String(editing.supplier_id),
        order_date: editing.order_date.slice(0, 10),
        expected_date: editing.expected_date?.slice(0, 10) ?? '',
        status: editing.status,
        notes: editing.notes ?? '',
        items: editing.items?.length
          ? editing.items.map((i) => ({ raw_material_id: i.raw_material_id, quantity: i.quantity, unit_price: i.unit_price }))
          : [{ raw_material_id: '', quantity: 1, unit_price: 0 }],
      })
    } else {
      setForm(emptyForm())
    }
  }, [editing])

  const supplierOptions = (suppliers ?? []).map((s) => ({ value: s.id, label: s.name }))
  const rawMaterialOptions = (rawMaterials ?? []).map((rm) => ({ value: rm.id, label: `${rm.name} (${rm.sku})` }))

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  useOpenCreateFromNav(openCreate)

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New Purchase Order
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              <th className="px-4 py-3">PO No</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Total</th>
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
            {data?.data.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{po.po_no}</td>
                <td className="px-4 py-3">{po.supplier?.name}</td>
                <td className="px-4 py-3">₹{Number(po.total).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Badge value={po.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {po.status !== 'received' && po.status !== 'cancelled' && (
                      <ActionButton
                        icon={PackageCheck}
                        label="Mark Received"
                        variant="success"
                        onClick={() => receiveMutation.mutate(po)}
                      />
                    )}
                    <ActionButton
                      icon={Pencil}
                      label="Edit"
                      variant="edit"
                      onClick={() => {
                        setEditing(po)
                        setModalOpen(true)
                      }}
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      variant="delete"
                      onClick={() => confirm('Delete this purchase order?') && deleteMutation.mutate(po.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.last_page > 1 && (
        <div className="mt-4 flex justify-end gap-2 text-sm">
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
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Purchase Order' : 'New Purchase Order'} onClose={() => setModalOpen(false)} wide>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const error = validateLineItems(form.items)
              if (error) {
                setFormError(error)
                return
              }
              setFormError(null)
              saveMutation.mutate()
            }}
            className="space-y-4"
          >
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Supplier *</label>
                <select
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                >
                  <option value="">Select…</option>
                  {supplierOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Order Date *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.order_date}
                  onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Expected Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.expected_date}
                  onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Line Items</label>
              <ItemsEditor
                columns={[
                  { name: 'raw_material_id', label: 'Raw Material', type: 'select', options: rawMaterialOptions },
                  { name: 'quantity', label: 'Qty', type: 'number' },
                  { name: 'unit_price', label: 'Unit Price', type: 'number' },
                ]}
                items={form.items}
                onChange={(items) => setForm({ ...form, items })}
                emptyItem={{ raw_material_id: '', quantity: 1, unit_price: 0 }}
              />
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
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Purchase Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
