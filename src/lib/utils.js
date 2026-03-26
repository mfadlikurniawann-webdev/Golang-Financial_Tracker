import { format, formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

/**
 * Format angka ke format Rupiah
 * formatRupiah(8500000) → "Rp 8.500.000"
 */
export function formatRupiah(amount, opts = {}) {
  const { compact = false, showSign = false } = opts

  if (compact && Math.abs(amount) >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `Rp ${val} jt`
  }
  if (compact && Math.abs(amount) >= 1_000) {
    const val = (amount / 1_000).toFixed(0)
    return `Rp ${val} rb`
  }

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))

  const sign = showSign && amount > 0 ? '+' : amount < 0 ? '-' : ''
  return sign + formatted
}

/**
 * Format tanggal ke string lokal
 * formatDate('2024-03-15') → "15 Maret 2024"
 */
export function formatDate(dateStr, pattern = 'd MMMM yyyy') {
  const d = new Date(dateStr)
  return format(d, pattern, { locale: localeId })
}

/**
 * Format ke "3 hari lalu"
 */
export function formatRelative(dateStr) {
  return formatDistanceToNow(new Date(dateStr), {
    addSuffix: true,
    locale: localeId,
  })
}

/**
 * Nama bulan dari index (0-based)
 */
export function monthName(date = new Date()) {
  return format(date, 'MMMM yyyy', { locale: localeId })
}

/**
 * Kelompokkan transaksi berdasarkan tanggal
 */
export function groupByDate(transactions) {
  const groups = {}
  transactions.forEach(tx => {
    const key = tx.date
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  })
  // Sort keys desc
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

/**
 * Hitung persentase aman untuk progress bar
 */
export function safePercent(value, total) {
  if (!total || total === 0) return 0
  return Math.min(Math.round((value / total) * 100), 100)
}

/**
 * Warna untuk progress bar anggaran
 */
export function budgetColor(pct) {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 75) return 'bg-yellow-500'
  return 'bg-primary-500'
}

/**
 * Clamp number between min and max
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}
