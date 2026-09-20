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

export function exportToCsv(filename: string, columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','))
  const csv = [header, ...lines].join('\r\n')

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
