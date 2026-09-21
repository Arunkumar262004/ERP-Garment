import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportColumn } from './exportCsv'

interface PdfSection {
  heading?: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
}

interface PdfTotalLine {
  label: string
  value: string
  emphasis?: boolean
}

export function exportToPdf({
  title,
  subtitle,
  sections,
  filename,
  totals,
}: {
  title: string
  subtitle?: string
  sections: PdfSection[]
  filename: string
  totals?: PdfTotalLine[]
}) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10

  doc.setDrawColor(210)
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)

  let y = 20

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

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, y)
  y += 7

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

  if (totals?.length) {
    const rightEdge = pageWidth - margin - 4
    totals.forEach((line) => {
      doc.setFontSize(line.emphasis ? 12 : 10)
      doc.setTextColor(line.emphasis ? 20 : 90)
      doc.setFont('helvetica', line.emphasis ? 'bold' : 'normal')
      doc.text(`${line.label}: ${line.value}`, rightEdge, y, { align: 'right' })
      y += line.emphasis ? 7 : 6
    })
    doc.setFont('helvetica', 'normal')
  }

  const url = doc.output('bloburl')
  window.open(url as unknown as string, '_blank')
  return { doc, filename }
}
