import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import { api } from '../../api/client'
import type { Lead, Paginated, Contact } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<Lead> = {
  title: 'Lead',
  endpoint: '/leads',
  queryKey: 'leads',
  searchPlaceholder: 'Search leads…',
  columns: [
    { key: 'lead_no', label: 'Lead No' },
    { key: 'name', label: 'Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'phone', label: 'Phone' },
    { key: 'source', label: 'Source', render: (row) => <Badge value={row.source} /> },
    { key: 'status', label: 'Status', render: (row) => <Badge value={row.status} /> },
    {
      key: 'expected_value',
      label: 'Expected Value',
      render: (row) => `₹${Number(row.expected_value).toLocaleString('en-IN')}`,
    },
  ],
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'company_name', label: 'Company Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'text' },
    {
      name: 'contact_id',
      label: 'Linked Contact (B2B)',
      type: 'select',
      loadOptions: async () => {
        const res = await api.get<Paginated<Contact>>('/contacts', { params: { type: 'b2b', per_page: 100 } })
        return res.data.data.map((c) => ({ value: c.id, label: `${c.name} (${c.company_name ?? c.code})` }))
      },
    },
    {
      name: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'cold_call', label: 'Cold Call' },
        { value: 'social_media', label: 'Social Media' },
        { value: 'exhibition', label: 'Exhibition' },
        { value: 'other', label: 'Other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'negotiation', label: 'Negotiation' },
        { value: 'won', label: 'Won' },
        { value: 'lost', label: 'Lost' },
      ],
      defaultValue: 'new',
    },
    { name: 'expected_value', label: 'Expected Value (₹)', type: 'number' },
    { name: 'expected_close_date', label: 'Expected Close Date', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
  ],
}

export default function LeadsPage() {
  return <ResourcePage<Lead> config={config} />
}
