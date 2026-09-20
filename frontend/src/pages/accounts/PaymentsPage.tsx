import ResourcePage from '../../components/resource/ResourcePage'
import { api } from '../../api/client'
import type { Invoice, Paginated, Payment } from '../../types'
import type { ResourceConfig } from '../../components/resource/types'

const config: ResourceConfig<Payment> = {
  title: 'Payment',
  endpoint: '/payments',
  queryKey: 'payments',
  allowEdit: false,
  columns: [
    { key: 'invoice', label: 'Invoice', render: (row) => row.invoice?.invoice_no ?? '—' },
    { key: 'amount', label: 'Amount', render: (row) => `₹${Number(row.amount).toLocaleString('en-IN')}` },
    { key: 'payment_date', label: 'Date', render: (row) => row.payment_date?.slice(0, 10) },
    { key: 'payment_method', label: 'Method' },
    { key: 'reference_no', label: 'Reference No' },
  ],
  fields: [
    {
      name: 'invoice_id',
      label: 'Invoice',
      type: 'select',
      required: true,
      loadOptions: async () => {
        const res = await api.get<Paginated<Invoice>>('/invoices', {
          params: { per_page: 100 },
        })
        return res.data.data.map((inv) => ({
          value: inv.id,
          label: `${inv.invoice_no} — Balance ₹${inv.balance_amount}`,
        }))
      },
    },
    { name: 'amount', label: 'Amount (₹)', type: 'number', required: true },
    { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
    {
      name: 'payment_method',
      label: 'Method',
      type: 'select',
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'upi', label: 'UPI' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'card', label: 'Card' },
        { value: 'other', label: 'Other' },
      ],
      defaultValue: 'bank_transfer',
    },
    { name: 'reference_no', label: 'Reference No', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
  ],
}

export default function PaymentsPage() {
  return <ResourcePage<Payment> config={config} />
}
