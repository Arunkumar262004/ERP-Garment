import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContactsPage from './pages/contacts/ContactsPage'
import LeadsPage from './pages/crm/LeadsPage'
import CrmTasksPage from './pages/crm/CrmTasksPage'
import QuotationsPage from './pages/accounts/QuotationsPage'
import InvoicesPage from './pages/accounts/InvoicesPage'
import PaymentsPage from './pages/accounts/PaymentsPage'
import ProductionOrdersPage from './pages/production/ProductionOrdersPage'
import ProcessesPage from './pages/production/ProcessesPage'
import RawMaterialsPage from './pages/purchase/RawMaterialsPage'
import SuppliersPage from './pages/purchase/SuppliersPage'
import PurchaseOrdersPage from './pages/purchase/PurchaseOrdersPage'
import DeliveriesPage from './pages/delivery/DeliveriesPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/contacts/b2b" element={<ContactsPage type="b2b" />} />
          <Route path="/contacts/b2c" element={<ContactsPage type="b2c" />} />
          <Route path="/contacts/employees" element={<ContactsPage type="employee" />} />

          <Route path="/crm/leads" element={<LeadsPage />} />
          <Route path="/crm/tasks" element={<CrmTasksPage />} />

          <Route path="/accounts/quotations" element={<QuotationsPage />} />
          <Route path="/accounts/invoices" element={<InvoicesPage />} />
          <Route path="/accounts/payments" element={<PaymentsPage />} />

          <Route path="/production/orders" element={<ProductionOrdersPage />} />
          <Route path="/production/processes" element={<ProcessesPage />} />

          <Route path="/purchase/raw-materials" element={<RawMaterialsPage />} />
          <Route path="/purchase/suppliers" element={<SuppliersPage />} />
          <Route path="/purchase/orders" element={<PurchaseOrdersPage />} />

          <Route path="/delivery" element={<DeliveriesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
