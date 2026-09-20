import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Info,
  Receipt,
  ShoppingCart,
  Truck,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import { computeAlerts, type AlertSeverity } from '../lib/alerts'
import KpiCard from '../components/KpiCard'

const formatCurrency = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const DONUT_COLORS = ['#7c3aed', '#10b981', '#0ea5e9', '#f59e0b', '#cbd5e1']

const ALERT_STYLES: Record<AlertSeverity, { bg: string; text: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertTriangle },
  warning: { bg: 'bg-amber-50', text: 'text-amber-600', icon: AlertTriangle },
  info: { bg: 'bg-sky-50', text: 'text-sky-600', icon: Info },
  accent: { bg: 'bg-brand-50', text: 'text-brand-600', icon: Truck },
}

const QUICK_ACTIONS = [
  { label: 'New Quotation', to: '/accounts/quotations/new', icon: FileText },
  { label: 'New Invoice', to: '/accounts/invoices/new', icon: Receipt },
  { label: 'New Production Order', to: '/production/orders/new', icon: ShoppingCart },
  { label: 'New Purchase Order', to: '/purchase/orders', icon: ClipboardList },
  { label: 'New B2B Customer', to: '/contacts/b2b', icon: UserPlus },
  { label: 'New Supplier', to: '/purchase/suppliers', icon: Building2 },
  { label: 'Record Payment', to: '/accounts/payments', icon: CreditCard },
  { label: 'New Delivery', to: '/delivery', icon: Truck },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) {
    return <div className="text-slate-400">Loading dashboard…</div>
  }

  const alerts = computeAlerts(data)
  const topItemsTotal = data.top_items.reduce((sum, i) => sum + i.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">Welcome back, {user?.name} 👋</p>
        </div>
        <span className="w-fit rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          icon={Wallet}
          iconClass="bg-brand-600"
          label="Total Sales (Today)"
          value={formatCurrency(data.kpis.sales_today.value)}
          change={data.kpis.sales_today.change}
          changeLabel="vs Yesterday"
        />
        <KpiCard
          icon={ShoppingCart}
          iconClass="bg-emerald-500"
          label="Total Purchases (Today)"
          value={formatCurrency(data.kpis.purchases_today.value)}
          change={data.kpis.purchases_today.change}
          changeLabel="vs Yesterday"
        />
        <KpiCard
          icon={Boxes}
          iconClass="bg-sky-500"
          label="Inventory Value"
          value={formatCurrency(data.kpis.inventory_value.value)}
          note={`${data.purchase.low_stock_materials} materials low on stock`}
        />
        <KpiCard
          icon={ClipboardList}
          iconClass="bg-amber-500"
          label="Production (Today)"
          value={`${data.kpis.production_today.value.toLocaleString('en-IN')} Units`}
          change={data.kpis.production_today.change}
          changeLabel="vs Yesterday"
        />
        <KpiCard
          icon={CreditCard}
          iconClass="bg-rose-500"
          label="Revenue (MTD)"
          value={formatCurrency(data.kpis.revenue_mtd.value)}
          change={data.kpis.revenue_mtd.change}
          changeLabel="vs Last Month"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <p className="mb-3 text-sm font-semibold text-slate-700">Sales Overview</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthly_revenue_trend}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} width={50} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="total" stroke="#7c3aed" fill="url(#revenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <p className="mb-3 text-sm font-semibold text-slate-700">Top Invoiced Items</p>
          {data.top_items.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No invoice data yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.top_items}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {data.top_items.map((entry, i) => (
                        <Cell key={entry.label} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} units`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-slate-400">Total</span>
                  <span className="text-sm font-bold text-slate-800">{topItemsTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {data.top_items.map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="shrink-0 font-medium text-slate-700">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Alerts &amp; Notifications</p>
          </div>
          {alerts.length === 0 && <p className="py-10 text-center text-sm text-slate-400">You&apos;re all caught up.</p>}
          <div className="space-y-2">
            {alerts.map((alert) => {
              const style = ALERT_STYLES[alert.severity]
              const AlertIcon = style.icon
              return (
                <Link
                  key={alert.id}
                  to={alert.href}
                  className={`flex items-center gap-3 rounded-lg p-2.5 hover:opacity-90 ${style.bg}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ${style.text}`}>
                    <AlertIcon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-700">{alert.label}</span>
                    <span className="block text-xs text-slate-400">{alert.description}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Low Stock Materials</p>
            <Link to="/purchase/raw-materials" className="text-xs font-medium text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          {data.low_stock_materials.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Stock levels look healthy.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">Material</th>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.low_stock_materials.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-2">
                      <span className="block font-medium text-slate-700">{m.name}</span>
                      <span className="block text-slate-400">{m.sku}</span>
                    </td>
                    <td className="py-2 pr-2 text-slate-600">
                      {m.current_stock} {m.unit}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          m.current_stock <= m.reorder_level / 2
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {m.current_stock <= m.reorder_level / 2 ? 'Critical' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Production Status</p>
            <Link to="/production/orders" className="text-xs font-medium text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          {data.production_status.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No production orders yet.</p>
          ) : (
            <div className="space-y-3">
              {data.production_status.map((order) => (
                <div key={order.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{order.order_no}</span>
                    <span className="capitalize text-slate-400">{order.current_process.replace('_', ' ')}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${order.progress >= 100 ? 'bg-emerald-500' : 'bg-brand-600'}`}
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{order.customer}</span>
                    <span>{order.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Team Activity</p>
            <Link to="/crm/tasks" className="text-xs font-medium text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          {data.team_activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No assigned CRM activity yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 text-center font-medium">Leads</th>
                  <th className="pb-2 text-center font-medium">Done</th>
                  <th className="pb-2 text-center font-medium">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.team_activity.map((member) => (
                  <tr key={member.name}>
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                          {initials(member.name)}
                        </span>
                        <span className="truncate font-medium text-slate-700">{member.name}</span>
                      </span>
                    </td>
                    <td className="py-2 text-center text-slate-600">{member.leads}</td>
                    <td className="py-2 text-center text-slate-600">{member.tasks_done}</td>
                    <td className="py-2 text-center text-slate-600">{member.tasks_pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Quick Actions</p>
        <div className="flex flex-wrap gap-2.5">
          {QUICK_ACTIONS.map((action) => {
            const ActionIcon = action.icon
            return (
              <Link
                key={action.label}
                to={action.to}
                state={{ openCreate: true }}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                <ActionIcon size={15} />
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
