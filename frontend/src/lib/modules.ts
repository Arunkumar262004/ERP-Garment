export interface ModuleItem {
  key: string
  label: string
}

export interface ModuleGroup {
  key: string
  label: string
  items?: ModuleItem[]
}

/**
 * Mirrors the navigation structure in Sidebar.tsx and the backend's
 * RoleController::ALL_MODULES — keep all three in sync when a page/section is
 * added or removed. Drives the Role Master's module permission picker and the
 * sidebar's permission-based filtering.
 */
export const MODULE_TREE: ModuleGroup[] = [
  { key: 'dashboard', label: 'Dashboard' },
  {
    key: 'contacts',
    label: 'Contacts',
    items: [
      { key: 'contacts.b2b', label: 'B2B Customers' },
      { key: 'contacts.b2c', label: 'B2C Customers' },
      { key: 'contacts.employees', label: 'Employees' },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    items: [
      { key: 'crm.leads', label: 'Leads' },
      { key: 'crm.tasks', label: 'Tasks' },
    ],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    items: [
      { key: 'accounts.quotations', label: 'Quotations' },
      { key: 'accounts.invoices', label: 'Invoices' },
      { key: 'accounts.payments', label: 'Payments' },
    ],
  },
  { key: 'production', label: 'Production' },
  {
    key: 'purchase',
    label: 'Purchase',
    items: [
      { key: 'purchase.raw-materials', label: 'Raw Materials' },
      { key: 'purchase.suppliers', label: 'Suppliers' },
      { key: 'purchase.orders', label: 'Purchase Orders' },
    ],
  },
  { key: 'delivery', label: 'Delivery' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'reports', label: 'Reports' },
  {
    key: 'masters',
    label: 'Masters',
    items: [
      { key: 'masters.sizes', label: 'Sizes' },
      { key: 'masters.brands', label: 'Brands' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    items: [
      { key: 'settings.users', label: 'Users' },
      { key: 'settings.roles', label: 'Roles' },
    ],
  },
]

export function allModuleKeys(): string[] {
  return MODULE_TREE.flatMap((g) => [g.key, ...(g.items?.map((i) => i.key) ?? [])])
}
