import type { DashboardData } from '../types'

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'accent'

export interface DashboardAlert {
  id: string
  label: string
  description: string
  href: string
  severity: AlertSeverity
}

export function computeAlerts(data: DashboardData): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  if (data.low_stock_materials.length > 0) {
    alerts.push({
      id: 'low-stock',
      label: `${data.low_stock_materials.length} Raw Materials Low on Stock`,
      description: 'View low stock materials',
      href: '/purchase/raw-materials',
      severity: 'critical',
    })
  }

  if (data.accounts.unpaid_invoices > 0) {
    alerts.push({
      id: 'unpaid-invoices',
      label: `${data.accounts.unpaid_invoices} Invoices Unpaid`,
      description: 'View unpaid invoices',
      href: '/accounts/invoices',
      severity: 'warning',
    })
  }

  if (data.purchase.open_purchase_orders > 0) {
    alerts.push({
      id: 'open-pos',
      label: `${data.purchase.open_purchase_orders} Purchase Orders Pending`,
      description: 'View purchase orders',
      href: '/purchase/orders',
      severity: 'info',
    })
  }

  if (data.delivery.pending > 0) {
    alerts.push({
      id: 'pending-deliveries',
      label: `${data.delivery.pending} Deliveries Pending`,
      description: 'View deliveries',
      href: '/delivery',
      severity: 'accent',
    })
  }

  return alerts
}
