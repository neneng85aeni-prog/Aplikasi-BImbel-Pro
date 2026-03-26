export function formatTanggal(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatMonthYear(month, year) {
  if (!month || !year) return '-'
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export function normalizePhone(value) {
  return String(value || '').replace(/[^\d+]/g, '')
}

export function csvEscape(v) {
  if (v === null || v === undefined) return ''
  const text = String(v).replace(/"/g, '""')
  return `"${text}"`
}

export function buildCsv(rows) {
  if (!rows.length) return ''
  
  const headers = Object.keys(rows[0])
  
  
  const lines = [headers.map(csvEscape).join(';')]
  
  rows.forEach((row) => {
   
    lines.push(headers.map((h) => csvEscape(row[h])).join(';'))
  })
  
  return lines.join('\n')
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateStudentBarcode({ nama, kelas, branchCode }) {
  const base = [branchCode || 'pusat', slugify(nama).slice(0, 10), slugify(kelas).slice(0, 6), Date.now().toString().slice(-6)]
    .filter(Boolean)
    .join('-')
  return `SISWA-${base}`.toUpperCase()
}

export function startOfWeek(dateValue) {
  const date = new Date(dateValue)
  const day = date.getDay() || 7
  if (day !== 1) date.setHours(-24 * (day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

export function startOfMonth(dateValue) {
  const date = new Date(dateValue)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

export function startOfDay(dateValue) {
  const date = new Date(dateValue)
  date.setHours(0, 0, 0, 0)
  return date
}

export function isSameDay(a, b) {
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10)
}
