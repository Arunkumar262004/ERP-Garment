import { Outlet, useLocation } from 'react-router-dom'
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
  '/production/orders': 'Production Orders',
  '/production/processes': 'Process Tracking',
  '/purchase/raw-materials': 'Raw Materials',
  '/purchase/suppliers': 'Suppliers',
  '/purchase/orders': 'Purchase Orders',
  '/delivery': 'Delivery',
  '/reports': 'Reports',
}

export default function MainLayout() {
  const location = useLocation()
  const title = TITLES[location.pathname] ?? 'ERP System'

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
