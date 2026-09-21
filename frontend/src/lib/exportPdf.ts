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

/**
 * jsPDF's built-in fonts (helvetica etc.) have no glyph for ₹ (U+20B9) —
 * without a custom embedded Unicode font it silently falls back to a
 * mojibake character instead. Swapping in "Rs." keeps every PDF export
 * readable without the weight of shipping/registering a custom font.
 */
function sanitizeForPdf(text: string): string {
  return text.replace(/₹/g, 'Rs. ')
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

  doc.setDrawColor(0)
  doc.setLineWidth(0.4)
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)

  let y = 20

  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text(sanitizeForPdf(title), 14, y)
  y += 3
  doc.setLineWidth(0.6)
  doc.line(14, y, pageWidth - margin - 4, y)
  y += 5

  doc.setFont('helvetica', 'normal')

  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(60)
    doc.text(sanitizeForPdf(subtitle), 14, y)
    y += 6
  }

  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, y)
  y += 7

  sections.forEach((section) => {
    if (section.heading) {
      doc.setFontSize(11)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'bold')
      doc.text(sanitizeForPdf(section.heading), 14, y + 4)
      doc.setFont('helvetica', 'normal')
      y += 8
    }

    autoTable(doc, {
      startY: y,
      head: [section.columns.map((c) => sanitizeForPdf(c.label))],
      body: section.rows.map((row) => section.columns.map((c) => sanitizeForPdf(String(row[c.key] ?? '—')))),
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { textColor: [0, 0, 0] },
      styles: { fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.15 },
      margin: { left: 14, right: 14 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  })

  if (totals?.length) {
    const rightEdge = pageWidth - margin - 4
    totals.forEach((line) => {
      doc.setFontSize(line.emphasis ? 12 : 10)
      doc.setTextColor(0)
      doc.setFont('helvetica', line.emphasis ? 'bold' : 'normal')
      doc.text(sanitizeForPdf(`${line.label}: ${line.value}`), rightEdge, y, { align: 'right' })
      y += line.emphasis ? 7 : 6
    })
    doc.setFont('helvetica', 'normal')
  }

  const url = doc.output('bloburl')
  window.open(url as unknown as string, '_blank')
  return { doc, filename }
}
