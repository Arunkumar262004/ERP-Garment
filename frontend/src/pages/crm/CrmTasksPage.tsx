import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import { api } from '../../api/client'
import type { CrmTask, Lead, Paginated } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<CrmTask> = {
  title: 'Task',
  endpoint: '/crm-tasks',
  queryKey: 'crm-tasks',
  searchPlaceholder: 'Search tasks…',
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type', render: (row) => <Badge value={row.type} /> },
    { key: 'priority', label: 'Priority', render: (row) => <Badge value={row.priority} /> },
    { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    { key: 'due_date', label: 'Due Date', render: (row) => (row.due_date ? row.due_date.slice(0, 10) : '—') },
  ],
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    {
      name: 'lead_id',
      label: 'Related Lead',
      type: 'select',
      loadOptions: async () => {
        const res = await api.get<Paginated<Lead>>('/leads', { params: { per_page: 100 } })
        return res.data.data.map((l) => ({ value: l.id, label: `${l.lead_no} — ${l.name}` }))
      },
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'call', label: 'Call' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'follow_up', label: 'Follow Up' },
        { value: 'email', label: 'Email' },
        { value: 'other', label: 'Other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      defaultValue: 'medium',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      defaultValue: 'pending',
    },
    { name: 'due_date', label: 'Due Date', type: 'date' },
  ],
}

export default function CrmTasksPage() {
  return <ResourcePage<CrmTask> config={config} />
}
