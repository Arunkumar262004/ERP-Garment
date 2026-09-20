import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import type { Brand } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<Brand> = {
  title: 'Brand',
  endpoint: '/brands',
  queryKey: 'brands',
  searchPlaceholder: 'Search brands…',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
  ],
  fields: [
    { name: 'name', label: 'Name (e.g. Kumar Basics)', type: 'text', required: true },
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

export default function BrandsPage() {
  return <ResourcePage<Brand> config={config} />
}
