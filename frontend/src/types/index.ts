export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'sales' | 'accounts' | 'production' | 'purchase' | 'crm' | 'viewer'
  is_active: boolean
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export type ContactType = 'b2b' | 'b2c' | 'employee'

export interface Contact {
  id: number
  type: ContactType
  code: string
  name: string
  company_name: string | null
  email: string | null
  phone: string | null
  alternate_phone: string | null
  gst_number: string | null
  pan_number: string | null
  billing_address: string | null
  shipping_address: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  employee_code: string | null
  designation: string | null
  department: string | null
  date_of_joining: string | null
  status: 'active' | 'inactive'
  notes: string | null
}

export interface Lead {
  id: number
  lead_no: string
  contact_id: number | null
  name: string
  company_name: string | null
  email: string | null
  phone: string | null
  source: string
  status: string
  expected_value: number
  expected_close_date: string | null
  assigned_to: number | null
  notes: string | null
  contact?: Contact
}

export interface CrmTask {
  id: number
  lead_id: number | null
  contact_id: number | null
  title: string
  description: string | null
  type: string
  priority: string
  status: string
  assigned_to: number | null
  due_date: string | null
  lead?: Lead
}

export interface LineItem {
  id?: number
  description: string
  quantity: number
  unit: string | null
  unit_price: number
  tax_percent: number
  total?: number
}

export interface Quotation {
  id: number
  quotation_no: string
  contact_id: number
  lead_id: number | null
  quotation_date: string
  valid_until: string | null
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  notes: string | null
  contact?: Contact
  items?: LineItem[]
}

export interface Invoice {
  id: number
  invoice_no: string
  contact_id: number
  quotation_id: number | null
  invoice_date: string
  due_date: string | null
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paid_amount: number
  balance_amount: number
  notes: string | null
  contact?: Contact
  items?: LineItem[]
}

export interface Payment {
  id: number
  invoice_id: number
  amount: number
  payment_date: string
  payment_method: string
  reference_no: string | null
  notes: string | null
  invoice?: Invoice
}

export interface Supplier {
  id: number
  code: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  gst_number: string | null
  status: 'active' | 'inactive'
}

export interface RawMaterial {
  id: number
  sku: string
  name: string
  category: string | null
  unit: string
  current_stock: number
  reorder_level: number
  unit_price: number
  default_supplier_id: number | null
  defaultSupplier?: Supplier
}

export interface PurchaseOrderItem {
  id?: number
  raw_material_id: number
  quantity: number
  unit_price: number
  total?: number
  received_quantity?: number
  rawMaterial?: RawMaterial
}

export interface PurchaseOrder {
  id: number
  po_no: string
  supplier_id: number
  order_date: string
  expected_date: string | null
  status: string
  subtotal: number
  tax: number
  total: number
  notes: string | null
  supplier?: Supplier
  items?: PurchaseOrderItem[]
}

export interface ProductionOrderItem {
  id?: number
  item_name: string
  description: string | null
  quantity: number
  unit: string | null
}

export interface ProductionProcess {
  id: number
  production_order_id: number
  process_type: string
  sequence: number
  status: string
  assigned_to: number | null
  quantity_completed: number
  start_date: string | null
  end_date: string | null
  remarks: string | null
  production_order?: ProductionOrder
}

export interface ProductionOrder {
  id: number
  order_no: string
  contact_id: number
  quotation_id: number | null
  invoice_id: number | null
  order_date: string
  expected_delivery_date: string | null
  status: string
  total_quantity: number
  notes: string | null
  contact?: Contact
  items?: ProductionOrderItem[]
  processes?: ProductionProcess[]
}

export interface Delivery {
  id: number
  delivery_no: string
  production_order_id: number
  contact_id: number
  delivery_date: string | null
  delivery_address: string | null
  status: string
  tracking_no: string | null
  delivered_by: string | null
  remarks: string | null
  productionOrder?: ProductionOrder
  contact?: Contact
}

export interface DashboardData {
  contacts: { b2b: number; b2c: number; employee: number }
  crm: { open_leads: number; won_this_month: number; pipeline_value: number }
  accounts: {
    pending_quotations: number
    unpaid_invoices: number
    outstanding_amount: number
    revenue_this_month: number
  }
  production: { pending: number; in_production: number; completed: number; delivered: number }
  purchase: { open_purchase_orders: number; low_stock_materials: number }
  delivery: { pending: number; delivered_this_month: number }
  monthly_revenue_trend: { month: string; total: number }[]
}
