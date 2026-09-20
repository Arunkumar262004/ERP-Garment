import { NavLink } from 'react-router-dom'

interface NavItem {
  label: string
  to: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  { title: '', items: [{ label: 'Dashboard', to: '/' }] },
  {
    title: 'Contacts',
    items: [
      { label: 'B2B Customers', to: '/contacts/b2b' },
      { label: 'B2C Customers', to: '/contacts/b2c' },
      { label: 'Employees', to: '/contacts/employees' },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Leads', to: '/crm/leads' },
      { label: 'Tasks', to: '/crm/tasks' },
    ],
  },
  {
    title: 'Accounts',
    items: [
      { label: 'Quotations', to: '/accounts/quotations' },
      { label: 'Invoices', to: '/accounts/invoices' },
      { label: 'Payments', to: '/accounts/payments' },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Production Orders', to: '/production/orders' },
      { label: 'Process Tracking', to: '/production/processes' },
    ],
  },
  {
    title: 'Purchase',
    items: [
      { label: 'Raw Materials', to: '/purchase/raw-materials' },
      { label: 'Suppliers', to: '/purchase/suppliers' },
      { label: 'Purchase Orders', to: '/purchase/orders' },
    ],
  },
  { title: '', items: [{ label: 'Delivery', to: '/delivery' }] },
  { title: '', items: [{ label: 'Reports', to: '/reports' }] },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <span className="text-lg font-bold text-brand-700">ERP System</span>
      </div>
      <nav className="flex-1 space-y-5 px-3 py-4">
        {NAV.map((group, idx) => (
          <div key={idx}>
            {group.title && (
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
