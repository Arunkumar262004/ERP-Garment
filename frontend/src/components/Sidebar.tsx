import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  Mail,
  Package,
  Ruler,
  Shirt,
  ShoppingBag,
  Target,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
}

interface NavGroup {
  key: string
  label: string
  icon: LucideIcon
  to?: string
  items?: NavItem[]
}

const NAV: NavGroup[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: Users,
    items: [
      { label: 'B2B Customers', to: '/contacts/b2b' },
      { label: 'B2C Customers', to: '/contacts/b2c' },
      { label: 'Employees', to: '/contacts/employees' },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: Target,
    items: [
      { label: 'Leads', to: '/crm/leads' },
      { label: 'Tasks', to: '/crm/tasks' },
    ],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    icon: Wallet,
    items: [
      { label: 'Quotations', to: '/accounts/quotations' },
      { label: 'Invoices', to: '/accounts/invoices' },
      { label: 'Payments', to: '/accounts/payments' },
    ],
  },
  { key: 'production', label: 'Production', icon: Shirt, to: '/production' },
  {
    key: 'purchase',
    label: 'Purchase',
    icon: ShoppingBag,
    items: [
      { label: 'Raw Materials', to: '/purchase/raw-materials' },
      { label: 'Suppliers', to: '/purchase/suppliers' },
      { label: 'Purchase Orders', to: '/purchase/orders' },
    ],
  },
  { key: 'delivery', label: 'Delivery', icon: Truck, to: '/delivery' },
  { key: 'inventory', label: 'Inventory', icon: Package, to: '/inventory' },
  { key: 'reports', label: 'Reports', icon: BarChart3, to: '/reports' },
  {
    key: 'masters',
    label: 'Masters',
    icon: Ruler,
    items: [
      { label: 'Sizes', to: '/masters/sizes' },
      { label: 'Brands', to: '/masters/brands' },
    ],
  },
]

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const location = useLocation()
  const activeGroupKey = NAV.find((g) => g.items?.some((i) => location.pathname === i.to))?.key
  const [openGroups, setOpenGroups] = useState<string[]>(activeGroupKey ? [activeGroupKey] : [])

  useEffect(() => {
    if (activeGroupKey && !openGroups.includes(activeGroupKey)) {
      setOpenGroups((prev) => [...prev, activeGroupKey])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupKey])

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-all duration-200 md:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-sm">
          <Shirt size={20} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">Garment ERP</p>
            <p className="truncate text-xs text-slate-400">Manufacturing &amp; Trade</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((group) => {
          const Icon = group.icon

          if (group.to) {
            return (
              <NavLink
                key={group.key}
                to={group.to}
                end={group.to === '/'}
                title={collapsed ? group.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{group.label}</span>}
              </NavLink>
            )
          }

          const isOpen = openGroups.includes(group.key)
          const isGroupActive = group.key === activeGroupKey

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                title={collapsed ? group.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isGroupActive ? 'text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left">{group.label}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </>
                )}
              </button>
              {!collapsed && isOpen && (
                <div className="ml-[1.65rem] mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                  {group.items?.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-2 text-sm font-medium transition ${
                          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <a
          href="mailto:support@garment-erp.test"
          title={collapsed ? 'Need Help?' : undefined}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          <Mail size={16} />
          {!collapsed && <span>Need Help?</span>}
        </a>
      </div>
    </aside>
  )
}
