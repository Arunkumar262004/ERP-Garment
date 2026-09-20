import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import { api } from '../../api/client'
import type { Contact, Delivery, Paginated, ProductionOrder } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<Delivery> = {
  title: 'Delivery',
  endpoint: '/deliveries',
  queryKey: 'deliveries',
  searchPlaceholder: 'Search deliveries…',
  columns: [
    { key: 'delivery_no', label: 'Delivery No' },
    {
      key: 'production_order',
      label: 'Production Order',
      render: (row) => row.production_order?.order_no ?? '—',
    },
    { key: 'contact', label: 'Customer', render: (row) => row.contact?.name ?? '—' },
    { key: 'delivery_date', label: 'Date', render: (row) => row.delivery_date?.slice(0, 10) ?? '—' },
    { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    { key: 'tracking_no', label: 'Tracking No' },
  ],
  fields: [
    {
      name: 'production_order_id',
      label: 'Production Order',
      type: 'select',
      required: true,
      loadOptions: async () => {
        const res = await api.get<Paginated<ProductionOrder>>('/production-orders', { params: { per_page: 100 } })
        return res.data.data.map((o) => ({ value: o.id, label: `${o.order_no} — ${o.contact?.name ?? ''}` }))
      },
    },
    {
      name: 'contact_id',
      label: 'Customer',
      type: 'select',
      required: true,
      loadOptions: async () => {
        const res = await api.get<Paginated<Contact>>('/contacts', { params: { per_page: 100 } })
        return res.data.data.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }))
      },
    },
    { name: 'delivery_date', label: 'Delivery Date', type: 'date' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'dispatched', label: 'Dispatched' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'returned', label: 'Returned' },
      ],
      defaultValue: 'pending',
    },
    { name: 'tracking_no', label: 'Tracking No', type: 'text' },
    { name: 'delivered_by', label: 'Delivered By', type: 'text' },
    { name: 'delivery_address', label: 'Delivery Address', type: 'textarea', span: 2 },
    { name: 'remarks', label: 'Remarks', type: 'textarea', span: 2 },
  ],
}

export default function DeliveriesPage() {
  return <ResourcePage<Delivery> config={config} />
}
