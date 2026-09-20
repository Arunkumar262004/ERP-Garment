import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { api } from '../../api/client'
import type { Paginated, Product, ProductionOrder, ProductionOrderItem, Size } from '../../types'
import { useToast } from '../../components/ToastProvider'

function PushToInventoryForm({
  order,
  item,
  autoOpen,
}: {
  order: ProductionOrder
  item: ProductionOrderItem
  autoOpen?: boolean
}) {
  const [open, setOpen] = useState(!!autoOpen && !item.variant)
  const [mode, setMode] = useState<'existing' | 'new'>('new')
  const [productId, setProductId] = useState('')
  const [newName, setNewName] = useState(item.garment_type ?? '')
  const [newCategory, setNewCategory] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [quantity, setQuantity] = useState(String(item.quantity))
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => (await api.get<Paginated<Product>>('/products', { params: { per_page: 100 } })).data.data,
    enabled: open,
  })

  const pushMutation = useMutation({
    mutationFn: () =>
      api.post(`/production-orders/${order.id}/items/${item.id}/push-to-inventory`, {
        ...(mode === 'existing' ? { product_id: productId } : { new_product: { name: newName, category: newCategory || undefined } }),
        price: Number(price),
        cost_price: costPrice ? Number(costPrice) : undefined,
        quantity: Number(quantity),
      }),
    onSuccess: () => {
      showToast('Added to Inventory', 'success')
      queryClient.invalidateQueries({ queryKey: ['production-order', String(order.id)] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-all'] })
      setOpen(false)
    },
  })

  if (order.order_type === 'others') {
    return (
      <div className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-500">
        This order is marked <span className="font-medium">Others</span> (made for a client) — it can&apos;t be
        pushed to your own retail Inventory.
      </div>
    )
  }

  if (item.variant) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        <span className="flex items-center gap-1.5">
          <Package size={13} /> In Inventory — SKU {item.variant.sku}, stock {item.variant.stock_quantity}
        </span>
        <button onClick={() => setOpen((v) => !v)} className="font-medium underline">
          Push more stock
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
        >
          <Package size={13} /> Push to Inventory
        </button>
      ) : (
        <div className="space-y-2 rounded-md bg-slate-50 p-3">
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} /> New Product
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} /> Existing Product
            </label>
          </div>
          {mode === 'new' ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Product name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Category (optional)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          ) : (
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Select product…</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.brand?.name ? `(${p.brand.name})` : ''}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Price *"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Cost price"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              Cancel
            </button>
            <button
              disabled={
                !price ||
                !quantity ||
                (mode === 'new' ? !newName : !productId) ||
                pushMutation.isPending
              }
              onClick={() => pushMutation.mutate()}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pushMutation.isPending ? 'Saving…' : 'Add to Inventory'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderItemsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusPush = searchParams.get('focus') === 'push'
  const [items, setItems] = useState<ProductionOrderItem[]>([])
  const [savingId, setSavingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['production-order', id],
    queryFn: async () => (await api.get<ProductionOrder>(`/production-orders/${id}`)).data,
  })

  const { data: sizes } = useQuery({
    queryKey: ['sizes'],
    queryFn: async () => (await api.get<Paginated<Size>>('/sizes', { params: { status: 'active' } })).data.data,
  })

  useEffect(() => {
    if (order) setItems(order.items ?? [])
  }, [order])

  const updateField = (itemId: number, field: keyof ProductionOrderItem, value: string) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)))
  }

  const saveItem = async (item: ProductionOrderItem) => {
    if (!item.id) return
    setSavingId(item.id)
    try {
      await api.put(`/production-orders/${id}/items/${item.id}`, {
        sku: item.sku || undefined,
        garment_type: item.garment_type || undefined,
        gsm: item.gsm ? Number(item.gsm) : undefined,
        cutting_weight_kg: item.cutting_weight_kg ? Number(item.cutting_weight_kg) : undefined,
        size_id: item.size_id || undefined,
        color: item.color || undefined,
        hsn_code: item.hsn_code || undefined,
        details: item.details || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['production-orders'] })
      queryClient.invalidateQueries({ queryKey: ['production-order', id] })
      queryClient.invalidateQueries({ queryKey: ['production-processes'] })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">
          Item Details{order ? ` — ${order.order_no}` : ''}
        </h2>
        <p className="text-sm text-slate-500">
          {order?.contact?.name}. Record SKU, garment type, GSM, cut weight (kg), size, color and HSN code per item —
          this data carries through every stage of the pipeline, so you can fill or fix it here regardless of what
          stage the order is currently at. Once an item is packed, push it into Inventory for retail sale.
        </p>
        {focusPush && (
          <p className="mt-2 rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700">
            Review each item below and confirm <span className="font-medium">Add to Inventory</span> — nothing is
            added to Products until you submit that form.
          </p>
        )}
      </div>

      {isLoading && <p className="text-slate-400">Loading…</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-slate-700">
                {item.item_name}{' '}
                <span className="text-slate-400">
                  ({item.quantity} {item.unit})
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">SKU</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.sku ?? ''}
                    onChange={(e) => updateField(item.id!, 'sku', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Garment Type</label>
                  <input
                    type="text"
                    placeholder="T-Shirt, Shirt, Trouser…"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.garment_type ?? ''}
                    onChange={(e) => updateField(item.id!, 'garment_type', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">GSM</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.gsm ?? ''}
                    onChange={(e) => updateField(item.id!, 'gsm', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Cut Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.cutting_weight_kg ?? ''}
                    onChange={(e) => updateField(item.id!, 'cutting_weight_kg', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Size {!item.size_id && <span className="text-amber-600">(not set)</span>}
                  </label>
                  <select
                    className={`w-full rounded-md border px-2 py-1.5 text-sm ${
                      item.size_id ? 'border-slate-300' : 'border-amber-300 bg-amber-50'
                    }`}
                    value={item.size_id ?? ''}
                    onChange={(e) => updateField(item.id!, 'size_id', e.target.value)}
                  >
                    <option value="">Select…</option>
                    {(sizes ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Color</label>
                  <input
                    type="text"
                    placeholder="Dye color used…"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.color ?? ''}
                    onChange={(e) => updateField(item.id!, 'color', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">HSN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 6109"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.hsn_code ?? ''}
                    onChange={(e) => updateField(item.id!, 'hsn_code', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Details</label>
                  <input
                    type="text"
                    placeholder="Fit, print, notes…"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={item.details ?? ''}
                    onChange={(e) => updateField(item.id!, 'details', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => saveItem(item)}
                  disabled={savingId === item.id}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingId === item.id ? 'Saving…' : 'Save'}
                </button>
              </div>
              {order && <PushToInventoryForm order={order} item={item} autoOpen={focusPush} />}
            </div>
          ))}
      </div>
    </div>
  )
}
