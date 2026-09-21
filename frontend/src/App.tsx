import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ContactsPage from './pages/contacts/ContactsPage'
import LeadsPage from './pages/crm/LeadsPage'
import LeadFormPage from './pages/crm/LeadFormPage'
import LeadCapturePage from './pages/crm/LeadCapturePage'
import CrmTasksPage from './pages/crm/CrmTasksPage'
import QuotationsPage from './pages/accounts/QuotationsPage'
import QuotationFormPage from './pages/accounts/QuotationFormPage'
import InvoicesPage from './pages/accounts/InvoicesPage'
import InvoiceFormPage from './pages/accounts/InvoiceFormPage'
import PaymentsPage from './pages/accounts/PaymentsPage'
import ProductionPage from './pages/production/ProductionPage'
import ProductionOrdersPage from './pages/production/ProductionOrdersPage'
import ProductionOrderFormPage from './pages/production/ProductionOrderFormPage'
import OrderItemsPage from './pages/production/OrderItemsPage'
import ProcessEditPage from './pages/production/ProcessEditPage'
import StageTrackingPage from './pages/production/StageTrackingPage'
import RawMaterialsPage from './pages/purchase/RawMaterialsPage'
import SuppliersPage from './pages/purchase/SuppliersPage'
import PurchaseOrdersPage from './pages/purchase/PurchaseOrdersPage'
import DeliveriesPage from './pages/delivery/DeliveriesPage'
import ReportsPage from './pages/ReportsPage'
import SizesPage from './pages/masters/SizesPage'
import BrandsPage from './pages/masters/BrandsPage'
import ProductsPage from './pages/inventory/ProductsPage'
import ProductDetailPage from './pages/inventory/ProductDetailPage'
import UsersPage from './pages/settings/UsersPage'
import RolesPage from './pages/settings/RolesPage'
import ProfilePage from './pages/ProfilePage'

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
          <Route path="/crm/leads/new" element={<LeadFormPage />} />
          <Route path="/crm/leads/capture" element={<LeadCapturePage />} />
          <Route path="/crm/leads/:id/edit" element={<LeadFormPage />} />
          <Route path="/crm/tasks" element={<CrmTasksPage />} />

          <Route path="/accounts/quotations" element={<QuotationsPage />} />
          <Route path="/accounts/quotations/new" element={<QuotationFormPage />} />
          <Route path="/accounts/quotations/:id/edit" element={<QuotationFormPage />} />
          <Route path="/accounts/invoices" element={<InvoicesPage />} />
          <Route path="/accounts/invoices/new" element={<InvoiceFormPage />} />
          <Route path="/accounts/invoices/:id/edit" element={<InvoiceFormPage />} />
          <Route path="/accounts/payments" element={<PaymentsPage />} />

          <Route path="/production" element={<ProductionPage />} />
          <Route path="/production/orders" element={<ProductionOrdersPage />} />
          <Route path="/production/orders/new" element={<ProductionOrderFormPage />} />
          <Route path="/production/orders/:id/edit" element={<ProductionOrderFormPage />} />
          <Route path="/production/orders/:id/items" element={<OrderItemsPage />} />
          <Route path="/production/orders/:orderId/processes/:processId/edit" element={<ProcessEditPage />} />
          <Route path="/production/stage/:type" element={<StageTrackingPage />} />

          <Route path="/purchase/raw-materials" element={<RawMaterialsPage />} />
          <Route path="/purchase/suppliers" element={<SuppliersPage />} />
          <Route path="/purchase/orders" element={<PurchaseOrdersPage />} />

          <Route path="/delivery" element={<DeliveriesPage />} />
          <Route path="/reports" element={<Navigate to="/reports/orders" replace />} />
          <Route path="/reports/:type" element={<ReportsPage />} />

          <Route path="/inventory" element={<ProductsPage />} />
          <Route path="/inventory/products/:id" element={<ProductDetailPage />} />

          <Route path="/masters/sizes" element={<SizesPage />} />
          <Route path="/masters/brands" element={<BrandsPage />} />

          <Route path="/settings/users" element={<UsersPage />} />
          <Route path="/settings/roles" element={<RolesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
