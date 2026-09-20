import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type Variant = 'view' | 'edit' | 'delete' | 'neutral' | 'success'

const VARIANT_STYLES: Record<Variant, string> = {
  view: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  edit: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  delete: 'bg-red-50 text-red-600 hover:bg-red-100',
  neutral: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  variant?: Variant
  onClick?: () => void
  to?: string
  title?: string
  disabled?: boolean
}

export default function ActionButton({
  icon: Icon,
  label,
  variant = 'neutral',
  onClick,
  to,
  title,
  disabled,
}: ActionButtonProps) {
  const className = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]}`

  if (to) {
    return (
      <Link to={to} title={title} className={className}>
        <Icon size={13} />
        {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} title={title} disabled={disabled} className={className}>
      <Icon size={13} />
      {label}
    </button>
  )
}
