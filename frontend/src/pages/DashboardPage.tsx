import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client'
import type { DashboardData } from '../types'
import StatCard from '../components/StatCard'

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardData>('/dashboard')).data,
  })

  if (isLoading || !data) {
    return <div className="text-slate-400">Loading dashboard…</div>
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Contacts</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="B2B Customers" value={data.contacts.b2b} />
          <StatCard label="B2C Customers" value={data.contacts.b2c} />
          <StatCard label="Employees" value={data.contacts.employee} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">CRM</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Open Leads" value={data.crm.open_leads} />
          <StatCard label="Won This Month" value={data.crm.won_this_month} />
          <StatCard label="Pipeline Value" value={formatCurrency(data.crm.pipeline_value)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Accounts</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Pending Quotations" value={data.accounts.pending_quotations} />
          <StatCard label="Unpaid Invoices" value={data.accounts.unpaid_invoices} />
          <StatCard label="Outstanding Amount" value={formatCurrency(data.accounts.outstanding_amount)} />
          <StatCard label="Revenue This Month" value={formatCurrency(data.accounts.revenue_this_month)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Production &amp; Purchase</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Pending Orders" value={data.production.pending} />
          <StatCard label="In Production" value={data.production.in_production} />
          <StatCard label="Completed" value={data.production.completed} />
          <StatCard label="Delivered" value={data.production.delivered} />
          <StatCard label="Open POs" value={data.purchase.open_purchase_orders} />
          <StatCard label="Low Stock Materials" value={data.purchase.low_stock_materials} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Delivery</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Pending Deliveries" value={data.delivery.pending} />
          <StatCard label="Delivered This Month" value={data.delivery.delivered_this_month} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Revenue Trend</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.monthly_revenue_trend}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#revenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
