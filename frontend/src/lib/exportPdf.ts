import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportColumn } from './exportCsv'

interface PdfSection {
  heading?: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
}

export function exportToPdf({
  title,
  subtitle,
  sections,
  filename,
}: {
  title: string
  subtitle?: string
  sections: PdfSection[]
  filename: string
}) {
  const doc = new jsPDF()
  let y = 16

  doc.setFontSize(16)
  doc.setTextColor(124, 58, 237)
  doc.text(title, 14, y)
  y += 7

  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(subtitle, 14, y)
    y += 6
  }

  sections.forEach((section) => {
    if (section.heading) {
      doc.setFontSize(11)
      doc.setTextColor(30)
      doc.text(section.heading, 14, y + 4)
      y += 8
    }

    autoTable(doc, {
      startY: y,
      head: [section.columns.map((c) => c.label)],
      body: section.rows.map((row) => section.columns.map((c) => String(row[c.key] ?? '—'))),
      headStyles: { fillColor: [124, 58, 237] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  })

  const url = doc.output('bloburl')
  window.open(url as unknown as string, '_blank')
  return { doc, filename }
}
