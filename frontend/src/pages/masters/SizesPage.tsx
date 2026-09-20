import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import type { Size } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<Size> = {
  title: 'Size',
  endpoint: '/sizes',
  queryKey: 'sizes',
  searchPlaceholder: 'Search sizes…',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'sort_order', label: 'Sort Order' },
    { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
  ],
  fields: [
    { name: 'name', label: 'Name (e.g. XL, M, S)', type: 'text', required: true },
    { name: 'sort_order', label: 'Sort Order', type: 'number', defaultValue: 0 },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      defaultValue: 'active',
    },
  ],
}

export default function SizesPage() {
  return <ResourcePage<Size> config={config} />
}
