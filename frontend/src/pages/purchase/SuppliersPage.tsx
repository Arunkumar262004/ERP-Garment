import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import type { Supplier } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<Supplier> = {
  title: 'Supplier',
  endpoint: '/suppliers',
  queryKey: 'suppliers',
  searchPlaceholder: 'Search suppliers…',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'contact_person', label: 'Contact Person', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'gst_number', label: 'GST Number', type: 'text' },
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
    { name: 'address', label: 'Address', type: 'textarea', span: 2 },
  ],
}

export default function SuppliersPage() {
  return <ResourcePage<Supplier> config={config} />
}
