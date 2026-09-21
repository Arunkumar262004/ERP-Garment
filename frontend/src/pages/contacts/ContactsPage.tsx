import ResourcePage from '../../components/resource/ResourcePage'
import Badge from '../../components/Badge'
import type { Contact, ContactType } from '../../types'
import type { FieldConfig, ResourceConfig } from '../../components/resource/types'

const COMMON_FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'country', label: 'Country', type: 'text', defaultValue: 'India' },
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
  { name: 'billing_address', label: 'Billing Address', type: 'textarea', span: 2 },
  { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
]

const B2B_FIELDS: FieldConfig[] = [
  { name: 'company_name', label: 'Company Name', type: 'text', required: true },
  { name: 'gst_number', label: 'GST Number', type: 'text' },
  { name: 'pan_number', label: 'PAN Number', type: 'text' },
  ...COMMON_FIELDS,
]

const B2C_FIELDS: FieldConfig[] = [...COMMON_FIELDS]

const EMPLOYEE_FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'employee_code', label: 'Employee Code', type: 'text' },
  { name: 'designation', label: 'Designation', type: 'text' },
  { name: 'department', label: 'Department', type: 'text' },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'cutting', label: 'Cutting' },
      { value: 'dyeing', label: 'Dyeing' },
      { value: 'stitching', label: 'Stitching' },
      { value: 'printing', label: 'Printing' },
      { value: 'packing', label: 'Packing' },
      { value: 'quality_check', label: 'Quality Check' },
      { value: 'other', label: 'Other' },
    ],
  },
  { name: 'date_of_joining', label: 'Date of Joining', type: 'date' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'text' },
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
  { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
]

export default function ContactsPage({ type }: { type: ContactType }) {
  const fields = type === 'b2b' ? B2B_FIELDS : type === 'employee' ? EMPLOYEE_FIELDS : B2C_FIELDS

  const columns =
    type === 'employee'
      ? [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'department', label: 'Department' },
          { key: 'category', label: 'Category', render: (row: Contact) => (row.category ? <Badge value={row.category} /> : '—') },
          { key: 'phone', label: 'Phone' },
          { key: 'status', label: 'Status', render: (row: Contact) => <Badge value={row.status} /> },
        ]
      : [
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          ...(type === 'b2b' ? [{ key: 'company_name', label: 'Company' }] : []),
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'city', label: 'City' },
          { key: 'status', label: 'Status', render: (row: Contact) => <Badge value={row.status} /> },
        ]

  const config: ResourceConfig<Contact> = {
    title: type === 'b2b' ? 'B2B Customer' : type === 'b2c' ? 'B2C Customer' : 'Employee',
    endpoint: '/contacts',
    queryKey: `contacts-${type}`,
    extraParams: { type },
    columns,
    fields,
    searchPlaceholder: 'Search by name, phone, email…',
    wide: type === 'employee',
  }

  return <ResourcePage<Contact> config={config} />
}
