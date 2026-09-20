import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../api/client'
import type { Brand, Contact, Paginated, ProductionOrder, RawMaterial } from '../../types'
import ItemsEditor from '../../components/ItemsEditor'

const STATUS_OPTIONS = ['pending', 'in_production', 'completed', 'delivered', 'cancelled']

interface ProductionOrderFormState {
  contact_id: string
  order_date: string
  expected_delivery_date: string
  status: string
  brand_id: string
  order_type: string
  notes: string
  items: Record<string, unknown>[]
  materials: Record<string, unknown>[]
}

function emptyForm(): ProductionOrderFormState {
  return {
    contact_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery_date: '',
    status: 'pending',
    brand_id: '',
    order_type: 'own',
    notes: '',
    items: [{ item_name: '', description: '', quantity: 1, unit: 'pcs' }],
    materials: [],
  }
}

export default function ProductionOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm())

  const { data: editing } = useQuery({
    queryKey: ['production-order', id],
    queryFn: async () => (await api.get<ProductionOrder>(`/production-orders/${id}`)).data,
    enabled: isEditing,
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: async () => (await api.get<Paginated<Contact>>('/contacts', { params: { per_page: 100 } })).data.data,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands-all'],
    queryFn: async () =>
      (await api.get<Paginated<Brand>>('/brands', { params: { status: 'active', per_page: 100 } })).data.data,
  })

  const { data: rawMaterials } = useQuery({
    queryKey: ['raw-materials-all'],
    queryFn: async () =>
      (await api.get<Paginated<RawMaterial>>('/raw-materials', { params: { per_page: 100 } })).data.data,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        contact_id: String(editing.contact_id),
        order_date: editing.order_date.slice(0, 10),
        expected_delivery_date: editing.expected_delivery_date?.slice(0, 10) ?? '',
        status: editing.status,
        brand_id: editing.brand_id ? String(editing.brand_id) : '',
        order_type: editing.order_type ?? 'own',
        notes: editing.notes ?? '',
        items: editing.items?.length
          ? editing.items.map((i) => ({ ...i }))
          : [{ item_name: '', description: '', quantity: 1, unit: 'pcs' }],
        materials: [],
      })
    }
  }, [editing])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contact_id: form.contact_id,
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || null,
        status: form.status,
        brand_id: form.brand_id || null,
        order_type: form.order_type,
        notes: form.notes,
        items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
        ...(isEditing
          ? {}
          : {
              materials: form.materials
                .filter((m) => m.raw_material_id)
                .map((m) => ({ raw_material_id: m.raw_material_id, quantity: Number(m.quantity) })),
            }),
      }
      if (isEditing) return api.put(`/production-orders/${id}`, payload)
      return api.post('/production-orders', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] })
      queryClient.invalidateQueries({ queryKey: ['raw-materials-all'] })
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] })
      navigate('/production/orders')
    },
  })

  const contactOptions = (contacts ?? []).map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
  const rawMaterialOptions = (rawMaterials ?? []).map((rm) => ({
    value: rm.id,
    label: `${rm.name} — ${rm.current_stock} ${rm.unit} in stock`,
  }))

  return (
    <div>
      <Link
        to="/production/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          {isEditing ? `Edit Production Order${editing ? ` — ${editing.order_no}` : ''}` : 'New Production Order'}
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate()
        }}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            1. Customer &amp; Delivery
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer *</label>
              <select
                required
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Expected Delivery Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.expected_delivery_date}
                onChange={(e) => setForm({ ...form, expected_delivery_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
              >
                <option value="">Select…</option>
                {(brands ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Manage the list in{' '}
                <Link to="/masters/brands" className="font-medium text-brand-600 hover:underline">
                  Masters → Brands
                </Link>
                .
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Order Type</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.order_type}
                onChange={(e) => setForm({ ...form, order_type: e.target.value })}
              >
                <option value="own">Own — for our retail stock</option>
                <option value="others">Others — made for a client</option>
              </select>
            </div>
            {isEditing && (
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
            )}
          </div>
        </div>

        {!isEditing && (
          <div>
            {form.materials.length === 0 && (
              <p className="mb-2 text-xs text-slate-400">
                2. Raw Cloth / Material Usage — optional, record raw material (e.g. fabric, kg) consumed for this
                order. Stock is deducted immediately on save.
              </p>
            )}
            <ItemsEditor
              title="2. Raw Cloth / Material Usage"
              columns={[
                { name: 'raw_material_id', label: 'Raw Material', type: 'select', options: rawMaterialOptions },
                { name: 'quantity', label: 'Quantity Used', type: 'number' },
              ]}
              items={form.materials}
              onChange={(materials) => setForm({ ...form, materials })}
              emptyItem={{ raw_material_id: '', quantity: 1 }}
            />
          </div>
        )}

        <div>
          <ItemsEditor
            title="3. Order Items"
            columns={[
              { name: 'item_name', label: 'Item Name', type: 'text' },
              { name: 'description', label: 'Description', type: 'text' },
              { name: 'quantity', label: 'Qty', type: 'number' },
              { name: 'unit', label: 'Unit', type: 'text' },
            ]}
            items={form.items}
            onChange={(items) => setForm({ ...form, items })}
            emptyItem={{ item_name: '', description: '', quantity: 1, unit: 'pcs' }}
          />
          {isEditing && (
            <p className="mt-1 text-xs text-slate-400">
              SKU, garment type, GSM and size are recorded per item from the{' '}
              <Link to={`/production/orders/${id}/items`} className="font-medium text-brand-600 hover:underline">
                Item Details
              </Link>{' '}
              page.
            </p>
          )}
          {!isEditing && (
            <p className="mt-1 text-xs text-slate-400">
              No process stage is assigned yet — save the order, then use{' '}
              <span className="font-medium text-slate-600">Quick Option</span> to move it into Dyeing, Cutting, etc.
            </p>
          )}
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
            to="/production/orders"
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  )
}
