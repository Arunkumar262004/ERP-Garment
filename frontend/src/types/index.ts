export interface Role {
  id: number
  name: string
  permissions: string[] | null
  users_count?: number
}

export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'admin' | 'sales' | 'accounts' | 'production' | 'purchase' | 'crm' | 'viewer'
  role_id?: number | null
  assigned_role?: Role | null
  specialization?: 'healthcare_erp' | 'basic_crm' | 'automation_crm' | 'general' | null
  is_active: boolean
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface AppNotification {
  id: string
  type: string
  data: {
    title: string
    message: string
    url?: string
    [key: string]: unknown
  }
  read_at: string | null
  created_at: string
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
  category: string | null
  date_of_joining: string | null
  status: 'active' | 'inactive'
  notes: string | null
}

export interface LeadItem {
  id?: number
  product_id: number | null
  description: string
  quantity: number
  unit: string | null
  target_price: number | null
  delivery_date: string | null
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
  follow_up_date: string | null
  assigned_to: number | null
  notes: string | null
  contact?: Contact
  assignee?: User | null
  items?: LeadItem[]
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
  discount?: number
  tax_percent: number
  total?: number
  product_variant_id?: number | null
  productVariant?: ProductVariant | null
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

export interface Size {
  id: number
  name: string
  sort_order: number
  status: 'active' | 'inactive'
}

export interface Brand {
  id: number
  name: string
  status: 'active' | 'inactive'
}

export interface ProductionOrderItem {
  id?: number
  item_name: string
  description: string | null
  quantity: number
  unit: string | null
  sku?: string | null
  garment_type?: string | null
  gsm?: number | null
  dia?: number | null
  counts?: string | null
  cutting_weight_kg?: number | null
  size_id?: number | null
  size?: Size | null
  color?: string | null
  hsn_code?: string | null
  details?: string | null
  variant?: ProductVariant | null
}

export interface ProductionOrderMaterial {
  id?: number
  raw_material_id: number
  quantity: number
  unit?: string | null
  rawMaterial?: RawMaterial
}

export interface ProcessStageCount {
  process_type: string
  pending: number
  in_progress: number
  completed: number
  skipped: number
  total: number
}

export interface ProductionProcess {
  id: number
  production_order_id: number
  process_type: string
  sequence: number
  status: string
  assigned_to: number | null
  assigned_employee_id: number | null
  quantity_completed: number
  start_date: string | null
  end_date: string | null
  due_date: string | null
  remarks: string | null
  production_order?: ProductionOrder
  items?: ProductionOrderItem[]
  employee?: Contact | null
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
  brand_id?: number | null
  brand?: Brand | null
  order_type?: 'own' | 'others'
  notes: string | null
  contact?: Contact
  items?: ProductionOrderItem[]
  processes?: ProductionProcess[]
  materials?: ProductionOrderMaterial[]
}

export interface Product {
  id: number
  name: string
  brand_id: number | null
  brand?: Brand | null
  garment_type: string | null
  category: string | null
  hsn_code: string | null
  description: string | null
  status: 'active' | 'inactive'
  variants_count?: number
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: number
  product_id: number
  size_id: number | null
  color: string | null
  sku: string
  stock_quantity: number
  price: number
  cost_price: number | null
  production_order_item_id?: number | null
  product?: Product
  size?: Size | null
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
  production_order?: ProductionOrder
  contact?: Contact
}

export interface Kpi {
  value: number
  change: number | null
}

export interface DashboardData {
  kpis: {
    sales_today: Kpi
    purchases_today: Kpi
    inventory_value: Kpi
    production_today: Kpi
    revenue_mtd: Kpi
  }
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
  top_items: { label: string; value: number; percent: number }[]
  low_stock_materials: {
    id: number
    sku: string
    name: string
    current_stock: number
    reorder_level: number
    unit: string
  }[]
  production_status: {
    id: number
    order_no: string
    customer: string | null
    status: string
    progress: number
    current_process: string
  }[]
  team_activity: { name: string; leads: number; tasks_done: number; tasks_pending: number }[]
}
