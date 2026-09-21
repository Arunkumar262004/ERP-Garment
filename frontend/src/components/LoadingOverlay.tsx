import { Loader2 } from 'lucide-react'

/**
 * Blocks the whole page behind a backdrop while a save/convert action is in
 * flight, so a double-click or a click elsewhere can't fire a second request
 * mid-save. Has no close button by design — it disappears on its own once
 * the caller's mutation settles.
 */
export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40">
      <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-xl">
        <Loader2 size={22} className="animate-spin text-brand-600" />
        <p className="text-sm font-medium text-slate-700">{message}</p>
      </div>
    </div>
  )
}
