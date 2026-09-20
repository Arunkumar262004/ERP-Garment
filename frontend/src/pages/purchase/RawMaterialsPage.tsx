import ResourcePage from '../../components/resource/ResourcePage'
import { api } from '../../api/client'
import type { Paginated, RawMaterial, Supplier } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<RawMaterial> = {
  title: 'Raw Material',
  endpoint: '/raw-materials',
  queryKey: 'raw-materials',
  searchPlaceholder: 'Search raw materials…',
  columns: [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'current_stock',
      label: 'Stock',
      render: (row) => (
        <span className={Number(row.current_stock) <= Number(row.reorder_level) ? 'font-semibold text-red-600' : ''}>
          {row.current_stock}
        </span>
      ),
    },
    { key: 'reorder_level', label: 'Reorder Level' },
    { key: 'unit_price', label: 'Unit Price', render: (row) => `₹${row.unit_price}` },
  ],
  fields: [
    { name: 'sku', label: 'SKU', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'unit', label: 'Unit (kg / meter / pcs)', type: 'text', required: true },
    { name: 'current_stock', label: 'Current Stock', type: 'number' },
    { name: 'reorder_level', label: 'Reorder Level', type: 'number' },
    { name: 'unit_price', label: 'Unit Price (₹)', type: 'number' },
    {
      name: 'default_supplier_id',
      label: 'Default Supplier',
      type: 'select',
      loadOptions: async () => {
        const res = await api.get<Paginated<Supplier>>('/suppliers', { params: { per_page: 100 } })
        return res.data.data.map((s) => ({ value: s.id, label: s.name }))
      },
    },
  ],
}

export default function RawMaterialsPage() {
  return <ResourcePage<RawMaterial> config={config} />
}
