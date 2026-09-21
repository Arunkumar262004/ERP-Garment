import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { api } from '../api/client'
import { exportSectionsToCsv, type ExportColumn } from '../lib/exportCsv'
import { exportToPdf } from '../lib/exportPdf'
import Badge from '../components/Badge'
import type { CrmTask, Delivery, Invoice, Lead, ProductionOrder, PurchaseOrder, Quotation } from '../types'

const REPORTS = [
  { key: 'orders', label: 'Order Report' },
  { key: 'b2b', label: 'B2B Report' },
  { key: 'b2c', label: 'B2C Report' },
  { key: 'crm', label: 'CRM Report' },
  { key: 'production', label: 'Production Report' },
  { key: 'purchase', label: 'Purchase Report' },
  { key: 'accounts', label: 'Accounts Report' },
  { key: 'delivery', label: 'Delivery Report' },
]

interface ReportResponse {
  summary: Record<string, unknown>
  data?: unknown[]
  invoices?: Invoice[]
  quotations?: Quotation[]
  leads?: Lead[]
  tasks?: CrmTask[]
}

interface ReportSection {
  heading?: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
}

function dateStr(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '—'
}

function money(value: unknown): string {
  return `₹${Number(value ?? 0).toLocaleString('en-IN')}`
}

const ORDER_COLUMNS: ExportColumn[] = [
  { key: 'order_no', label: 'Order No' },
  { key: 'customer', label: 'Customer' },
  { key: 'order_date', label: 'Order Date' },
  { key: 'order_type', label: 'Order Type' },
  { key: 'total_quantity', label: 'Quantity' },
  { key: 'status', label: 'Status' },
]

function orderRow(o: ProductionOrder) {
  return {
    order_no: o.order_no,
    customer: o.contact?.name ?? '—',
    order_date: dateStr(o.order_date),
    order_type: o.order_type === 'others' ? 'Others' : 'Own',
    total_quantity: o.total_quantity,
    status: o.status,
  }
}

const PROCESS_COLUMNS: ExportColumn[] = [
  { key: 'order_no', label: 'Order No' },
  { key: 'process_type', label: 'Process' },
  { key: 'sequence', label: 'Seq' },
  { key: 'status', label: 'Status' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
]

function processRows(o: ProductionOrder) {
  return (o.processes ?? []).map((p) => ({
    order_no: o.order_no,
    process_type: p.process_type,
    sequence: p.sequence,
    status: p.status,
    start_date: dateStr(p.start_date),
    end_date: dateStr(p.end_date),
  }))
}

const INVOICE_COLUMNS: ExportColumn[] = [
  { key: 'invoice_no', label: 'Invoice No' },
  { key: 'customer', label: 'Customer' },
  { key: 'invoice_date', label: 'Date' },
  { key: 'total', label: 'Total' },
  { key: 'balance_amount', label: 'Balance' },
  { key: 'status', label: 'Status' },
]

function invoiceRow(inv: Invoice) {
  return {
    invoice_no: inv.invoice_no,
    customer: inv.contact?.name ?? '—',
    invoice_date: dateStr(inv.invoice_date),
    total: money(inv.total),
    balance_amount: money(inv.balance_amount),
    status: inv.status,
  }
}

const QUOTATION_COLUMNS: ExportColumn[] = [
  { key: 'quotation_no', label: 'Quotation No' },
  { key: 'customer', label: 'Customer' },
  { key: 'quotation_date', label: 'Date' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
]

function quotationRow(q: Quotation) {
  return {
    quotation_no: q.quotation_no,
    customer: q.contact?.name ?? '—',
    quotation_date: dateStr(q.quotation_date),
    total: money(q.total),
    status: q.status,
  }
}

const LEAD_COLUMNS: ExportColumn[] = [
  { key: 'lead_no', label: 'Lead No' },
  { key: 'name', label: 'Name' },
  { key: 'company_name', label: 'Company' },
  { key: 'phone', label: 'Phone' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'expected_value', label: 'Expected Value' },
  { key: 'follow_up_date', label: 'Follow-up' },
]

function leadRow(l: Lead) {
  return {
    lead_no: l.lead_no,
    name: l.name,
    company_name: l.company_name ?? '—',
    phone: l.phone ?? '—',
    source: l.source,
    status: l.status,
    expected_value: money(l.expected_value),
    follow_up_date: dateStr(l.follow_up_date),
  }
}

const TASK_COLUMNS: ExportColumn[] = [
  { key: 'title', label: 'Title' },
  { key: 'lead', label: 'Lead' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'due_date', label: 'Due Date' },
]

function taskRow(t: CrmTask) {
  return {
    title: t.title,
    lead: t.lead?.name ?? '—',
    type: t.type,
    priority: t.priority,
    status: t.status,
    due_date: dateStr(t.due_date),
  }
}

const PURCHASE_COLUMNS: ExportColumn[] = [
  { key: 'po_no', label: 'PO No' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'order_date', label: 'Order Date' },
  { key: 'expected_date', label: 'Expected Date' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
]

function purchaseRow(po: PurchaseOrder) {
  return {
    po_no: po.po_no,
    supplier: po.supplier?.name ?? '—',
    order_date: dateStr(po.order_date),
    expected_date: dateStr(po.expected_date),
    total: money(po.total),
    status: po.status,
  }
}

const DELIVERY_COLUMNS: ExportColumn[] = [
  { key: 'delivery_no', label: 'Delivery No' },
  { key: 'order_no', label: 'Production Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'delivery_date', label: 'Delivery Date' },
  { key: 'status', label: 'Status' },
  { key: 'tracking_no', label: 'Tracking No' },
]

function deliveryRow(d: Delivery) {
  return {
    delivery_no: d.delivery_no,
    order_no: d.production_order?.order_no ?? '—',
    customer: d.contact?.name ?? '—',
    delivery_date: dateStr(d.delivery_date),
    status: d.status,
    tracking_no: d.tracking_no ?? '—',
  }
}

function buildSections(type: string, data: ReportResponse): ReportSection[] {
  switch (type) {
    case 'orders': {
      const orders = (data.data ?? []) as ProductionOrder[]
      return [{ columns: ORDER_COLUMNS, rows: orders.map(orderRow) }]
    }
    case 'production': {
      const orders = (data.data ?? []) as ProductionOrder[]
      return [
        { heading: 'Orders', columns: ORDER_COLUMNS, rows: orders.map(orderRow) },
        { heading: 'Process Pipeline', columns: PROCESS_COLUMNS, rows: orders.flatMap(processRows) },
      ]
    }
    case 'b2b':
    case 'b2c':
    case 'accounts': {
      const invoices = (data.invoices ?? []) as Invoice[]
      const quotations = (data.quotations ?? []) as Quotation[]
      return [
        { heading: 'Invoices', columns: INVOICE_COLUMNS, rows: invoices.map(invoiceRow) },
        { heading: 'Quotations', columns: QUOTATION_COLUMNS, rows: quotations.map(quotationRow) },
      ]
    }
    case 'crm': {
      const leads = (data.leads ?? []) as Lead[]
      const tasks = (data.tasks ?? []) as CrmTask[]
      return [
        { heading: 'Leads', columns: LEAD_COLUMNS, rows: leads.map(leadRow) },
        { heading: 'Tasks', columns: TASK_COLUMNS, rows: tasks.map(taskRow) },
      ]
    }
    case 'purchase': {
      const orders = (data.data ?? []) as PurchaseOrder[]
      return [{ columns: PURCHASE_COLUMNS, rows: orders.map(purchaseRow) }]
    }
    case 'delivery': {
      const deliveries = (data.data ?? []) as Delivery[]
      return [{ columns: DELIVERY_COLUMNS, rows: deliveries.map(deliveryRow) }]
    }
    default:
      return []
  }
}

function SectionTable({ section }: { section: ReportSection }) {
  return (
    <div className="mb-6">
      {section.heading && <h3 className="mb-2 text-sm font-semibold text-slate-600">{section.heading}</h3>}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500">
            <tr>
              {section.columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {section.rows.length === 0 && (
              <tr>
                <td colSpan={section.columns.length} className="px-4 py-6 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            )}
            {section.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {section.columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-slate-700">
                    {c.key === 'status' ? <Badge value={String(row[c.key] ?? '')} /> : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { type = 'orders' } = useParams<{ type: string }>()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const isValidType = REPORTS.some((r) => r.key === type)

  const { data, isLoading } = useQuery({
    queryKey: ['report', type, from, to],
    queryFn: async () =>
      (
        await api.get<ReportResponse>(`/reports/${type}`, {
          params: { from: from || undefined, to: to || undefined },
        })
      ).data,
    enabled: isValidType,
  })

  if (!isValidType) return <Navigate to="/reports/orders" replace />

  const activeLabel = REPORTS.find((r) => r.key === type)?.label ?? 'Report'
  const sections = data ? buildSections(type, data) : []

  const handleExportCsv = () => {
    if (!sections.length) return
    exportSectionsToCsv(`${type}-report`, sections)
  }

  const handleExportPdf = () => {
    if (!sections.length) return
    exportToPdf({
      title: activeLabel,
      subtitle: [from && `From ${from}`, to && `To ${to}`].filter(Boolean).join(' · ') || undefined,
      filename: `${type}-report`,
      sections,
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-semibold text-slate-800">{activeLabel}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!sections.length}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!sections.length}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <FileText size={15} />
            PDF Preview
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {isLoading && <div className="text-slate-400">Loading report…</div>}
      {!isLoading && sections.map((section, i) => <SectionTable key={section.heading ?? i} section={section} />)}
    </div>
  )
}
