import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type ToastVariant = 'info' | 'success' | 'error'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: typeof Info }> = {
  info: { bg: 'bg-slate-800', icon: Info },
  success: { bg: 'bg-emerald-600', icon: CheckCircle2 },
  error: { bg: 'bg-red-600', icon: AlertCircle },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant]
          const Icon = style.icon
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${style.bg}`}
            >
              <Icon size={16} />
              {toast.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
