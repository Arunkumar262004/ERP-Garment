import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Plus, Trash2 } from 'lucide-react'
import { api } from '../../api/client'
import type { ProductionOrderItem, Size } from '../../types'
import { useToast } from '../ToastProvider'
import { sanitizeNonNegativeInput, validateLineItems } from '../../lib/validation'

type Row = ProductionOrderItem & { _key: string }

function toRow(item: ProductionOrderItem): Row {
  return { ...item, _key: item.id ? `item-${item.id}` : `new-${Math.random()}` }
}

let newRowCounter = 0

function blankRow(): Row {
  newRowCounter += 1

  return {
    _key: `new-${newRowCounter}`,
    item_name: '',
    description: null,
    quantity: 1,
    unit: 'pcs',
    sku: null,
    garment_type: null,
    gsm: null,
    cutting_weight_kg: null,
    size_id: null,
    color: null,
    hsn_code: null,
    details: null,
  }
}

export interface ProcessItemsTableHandle {
  /** Validates and persists the current rows. Returns false (and shows its own inline/toast error) without throwing, so callers can decide whether to proceed. */
  save: () => Promise<boolean>
}

function cellInput(minWidth: string) {
  return `w-full ${minWidth} rounded-md border border-slate-300 px-2 py-1.5 text-sm`
}

const ProcessItemsTable = forwardRef<
  ProcessItemsTableHandle,
  {
    orderId: string
    processId: string
    allOrderItems: ProductionOrderItem[]
    importedItems: ProductionOrderItem[]
    sizes: Size[]
  }
>(function ProcessItemsTable({ orderId, processId, allOrderItems, importedItems, sizes }, ref) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [rows, setRows] = useState<Row[]>(() => importedItems.map(toRow))
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [justImportedIds, setJustImportedIds] = useState<Set<number>>(new Set())
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setRows(importedItems.map(toRow))
  }, [importedItems])

  const importedIds = new Set(importedItems.map((i) => i.id))
  const missedItems = allOrderItems.filter((i) => i.id && !importedIds.has(i.id))

  const importMutation = useMutation({
    mutationFn: () => api.post<{ imported: number[] }>(`/production-processes/${processId}/import-missed-items`),
    onSuccess: (res) => {
      setJustImportedIds(new Set(res.data.imported))
      queryClient.invalidateQueries({ queryKey: ['production-order', orderId] })
    },
  })

  const NUMERIC_FIELDS: (keyof ProductionOrderItem)[] = ['quantity', 'gsm', 'cutting_weight_kg']

  const updateField = (key: string, field: keyof ProductionOrderItem, value: string) => {
    const sanitized = NUMERIC_FIELDS.includes(field) ? sanitizeNonNegativeInput(value) : value
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: sanitized } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, blankRow()])

  const removeRow = (row: Row) => {
    if (row.id) setDeletedIds((prev) => [...prev, row.id as number])
    setRows((prev) => prev.filter((r) => r._key !== row._key))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(deletedIds.map((id) => api.delete(`/production-orders/${orderId}/items/${id}`)))

      await Promise.all(
        rows.map((row) => {
          const payload = {
            item_name: row.item_name,
            quantity: Number(row.quantity),
            unit: row.unit || undefined,
            sku: row.sku || undefined,
            garment_type: row.garment_type || undefined,
            gsm: row.gsm ? Number(row.gsm) : undefined,
            cutting_weight_kg: row.cutting_weight_kg ? Number(row.cutting_weight_kg) : undefined,
            size_id: row.size_id || undefined,
            color: row.color || undefined,
            hsn_code: row.hsn_code || undefined,
            details: row.details || undefined,
          }

          if (row.id) {
            return api.put(`/production-orders/${orderId}/items/${row.id}`, payload)
          }

          return api.post(`/production-orders/${orderId}/items`, { ...payload, production_process_id: processId })
        })
      )
    },
    onSuccess: () => {
      setDeletedIds([])
      queryClient.invalidateQueries({ queryKey: ['production-order', orderId] })
    },
    onError: () => showToast('Could not save item details', 'error'),
  })

  useImperativeHandle(ref, () => ({
    save: async () => {
      const error = validateLineItems(rows)
      if (error) {
        setFormError(error)
        return false
      }
      setFormError(null)
      try {
        await saveMutation.mutateAsync()
        return true
      } catch {
        return false
      }
    },
  }))

  return (
    <div>
      {missedItems.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-700">
            {missedItems.length} item{missedItems.length > 1 ? 's' : ''} added to this order after this stage started
            haven&apos;t been pulled in yet.
          </p>
          <button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Download size={13} />
            {importMutation.isPending ? 'Importing…' : `Import Missed Order Data (${missedItems.length})`}
          </button>
        </div>
      )}

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Plus size={14} /> Add Item
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No items recorded on this order yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-3 py-2">Item Name</th>
                <th className="px-2 py-2">Qty</th>
                <th className="px-2 py-2">UOM</th>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2">Garment Type</th>
                <th className="px-2 py-2">GSM</th>
                <th className="px-2 py-2">Cut Weight (kg)</th>
                <th className="px-2 py-2">Size</th>
                <th className="px-2 py-2">Color</th>
                <th className="px-2 py-2">HSN Code</th>
                <th className="px-2 py-2">Details</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row._key} className={row.id && justImportedIds.has(row.id) ? 'bg-amber-50' : undefined}>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      className={cellInput('min-w-[150px]')}
                      value={row.item_name}
                      onChange={(e) => updateField(row._key, 'item_name', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      className={cellInput('min-w-[80px]')}
                      value={row.quantity}
                      onChange={(e) => updateField(row._key, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      className={cellInput('min-w-[80px]')}
                      value={row.unit ?? ''}
                      onChange={(e) => updateField(row._key, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      placeholder="Auto"
                      className={cellInput('min-w-[120px]')}
                      value={row.sku ?? ''}
                      onChange={(e) => updateField(row._key, 'sku', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      placeholder="T-Shirt…"
                      className={cellInput('min-w-[140px]')}
                      value={row.garment_type ?? ''}
                      onChange={(e) => updateField(row._key, 'garment_type', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      className={cellInput('min-w-[80px]')}
                      value={row.gsm ?? ''}
                      onChange={(e) => updateField(row._key, 'gsm', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={cellInput('min-w-[110px]')}
                      value={row.cutting_weight_kg ?? ''}
                      onChange={(e) => updateField(row._key, 'cutting_weight_kg', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className={cellInput('min-w-[100px]')}
                      value={row.size_id ?? ''}
                      onChange={(e) => updateField(row._key, 'size_id', e.target.value)}
                    >
                      <option value="">Select…</option>
                      {sizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      className={cellInput('min-w-[110px]')}
                      value={row.color ?? ''}
                      onChange={(e) => updateField(row._key, 'color', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      placeholder="e.g. 6109"
                      className={cellInput('min-w-[110px]')}
                      value={row.hsn_code ?? ''}
                      onChange={(e) => updateField(row._key, 'hsn_code', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      placeholder="Fit, print…"
                      className={cellInput('min-w-[180px]')}
                      value={row.details ?? ''}
                      onChange={(e) => updateField(row._key, 'details', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formError && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      )}
    </div>
  )
})

export default ProcessItemsTable
