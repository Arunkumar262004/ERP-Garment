import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import ChatWidget from './ChatWidget'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/contacts/b2b': 'B2B Customers',
  '/contacts/b2c': 'B2C Customers',
  '/contacts/employees': 'Employees',
  '/crm/leads': 'Leads',
  '/crm/tasks': 'CRM Tasks',
  '/accounts/quotations': 'Quotations',
  '/accounts/invoices': 'Invoices',
  '/accounts/payments': 'Payments',
  '/production': 'Production',
  '/production/orders': 'Production Orders',
  '/production/orders/new': 'New Production Order',
  '/purchase/raw-materials': 'Raw Materials',
  '/purchase/suppliers': 'Suppliers',
  '/purchase/orders': 'Purchase Orders',
  '/delivery': 'Delivery',
  '/reports/orders': 'Order Report',
  '/reports/b2b': 'B2B Report',
  '/reports/b2c': 'B2C Report',
  '/reports/crm': 'CRM Report',
  '/reports/production': 'Production Report',
  '/reports/purchase': 'Purchase Report',
  '/reports/accounts': 'Accounts Report',
  '/reports/delivery': 'Delivery Report',
  '/inventory': 'Inventory',
  '/masters/sizes': 'Sizes',
  '/masters/brands': 'Brands',
}

function dynamicTitle(pathname: string): string | null {
  const stageMatch = pathname.match(/^\/production\/stage\/([a-z_]+)$/)
  if (stageMatch) return stageMatch[1].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  if (/^\/production\/orders\/\d+\/edit$/.test(pathname)) return 'Edit Production Order'
  if (/^\/production\/orders\/\d+\/items$/.test(pathname)) return 'Item Details'
  if (/^\/production\/orders\/\d+\/processes\/\d+\/edit$/.test(pathname)) return 'Edit Process'
  if (pathname === '/accounts/quotations/new') return 'New Quotation'
  if (/^\/accounts\/quotations\/\d+\/edit$/.test(pathname)) return 'Edit Quotation'
  if (pathname === '/accounts/invoices/new') return 'New Invoice'
  if (/^\/accounts\/invoices\/\d+\/edit$/.test(pathname)) return 'Edit Invoice'
  if (/^\/inventory\/products\/\d+$/.test(pathname)) return 'Product Detail'

  return null
}

export default function MainLayout() {
  const location = useLocation()
  const title = TITLES[location.pathname] ?? dynamicTitle(location.pathname) ?? 'ERP System'
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
