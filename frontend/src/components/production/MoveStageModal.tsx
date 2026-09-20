import { useState } from 'react'
import Modal from '../Modal'

interface StageOption {
  value: string
  label: string
}

export default function MoveStageModal({
  count,
  options,
  onConfirm,
  onClose,
  submitting,
}: {
  count: number
  options: StageOption[]
  onConfirm: (target: string) => void
  onClose: () => void
  submitting?: boolean
}) {
  const [target, setTarget] = useState('')

  return (
    <Modal title="Quick Option" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Move <span className="font-semibold text-slate-800">{count}</span> selected order{count === 1 ? '' : 's'} to:
        </p>
        <select
          autoFocus
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option value="">Select a process…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!target || submitting}
            onClick={() => onConfirm(target)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Converting…' : 'Convert'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
