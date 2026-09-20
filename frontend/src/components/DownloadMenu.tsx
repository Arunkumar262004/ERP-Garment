import { useEffect, useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

export default function DownloadMenu({ onExportCsv, onExportPdf }: { onExportCsv: () => void; onExportPdf: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <Download size={13} />
        Download
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onExportCsv()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            <FileSpreadsheet size={13} /> Excel (CSV)
          </button>
          <button
            type="button"
            onClick={() => {
              onExportPdf()
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            <FileText size={13} /> PDF Preview
          </button>
        </div>
      )}
    </div>
  )
}
