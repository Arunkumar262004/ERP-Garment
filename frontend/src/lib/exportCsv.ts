export interface ExportColumn {
  key: string
  label: string
}

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToCsv(filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','))
  downloadCsv(filename, [header, ...lines].join('\r\n'))
}

export interface CsvSection {
  heading?: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
}

export function exportSectionsToCsv(filename: string, sections: CsvSection[]) {
  const blocks = sections.map((section) => {
    const lines: string[] = []
    if (section.heading) lines.push(escapeCsvValue(section.heading))
    lines.push(section.columns.map((c) => escapeCsvValue(c.label)).join(','))
    section.rows.forEach((row) => lines.push(section.columns.map((c) => escapeCsvValue(row[c.key])).join(',')))
    return lines.join('\r\n')
  })
  downloadCsv(filename, blocks.join('\r\n\r\n'))
}
