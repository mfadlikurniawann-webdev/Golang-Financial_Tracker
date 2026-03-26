import { useState } from 'react'
import { subMonths, addMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { useBudgets } from '../hooks/useBudgets'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { formatRupiah, budgetColor, safePercent } from '../lib/utils'

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-600 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatRupiah(p.value, { compact: true })}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm]         = useState(false)

  const { transactions, loading, summary, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions(currentMonth)

  const { budgets } = useBudgets(currentMonth)

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: localeId })

  // Build weekly chart data (4 weeks of the month)
  const chartData = (() => {
    const weeks = ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4']
    return weeks.map((week, i) => {
      const weekTxs = transactions.filter(tx => {
        const day = parseInt(tx.date.split('-')[2])
        return day > i * 7 && day <= (i + 1) * 7
      })
      return {
        name: week,
        Pemasukan:  weekTxs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0),
        Pengeluaran: weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  })()

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan keuangan bulan ini</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="btn-secondary px-3 py-2"
          >
            ←
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            disabled={format(addMonths(currentMonth, 1), 'yyyy-MM') > format(new Date(), 'yyyy-MM')}
            className="btn-secondary px-3 py-2 disabled:opacity-40"
          >
            →
          </button>

          <button onClick={() => setShowForm(true)} className="btn-primary ml-2 flex items-center gap-2">
            <span className="text-base leading-none">+</span>
            Tambah
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatRupiah(summary.balance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {summary.balance >= 0 ? '✅ Surplus' : '⚠️ Defisit'} bulan ini
          </p>
        </div>

        <div className="metric-card border-l-4 border-l-green-400">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Pemasukan</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatRupiah(summary.income)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {transactions.filter(t => t.type === 'income').length} transaksi
          </p>
        </div>

        <div className="metric-card border-l-4 border-l-red-400">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatRupiah(summary.expense)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {transactions.filter(t => t.type === 'expense').length} transaksi
          </p>
        </div>
      </div>

      {/* Chart + Budgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Arus Kas per Minggu</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={v => formatRupiah(v, { compact: true })}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Pemasukan"  stroke="#22c55e" strokeWidth={2} fill="url(#colorIncome)"  dot={false} />
              <Area type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} fill="url(#colorExpense)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Budget snapshot */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Anggaran</h2>
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p>Belum ada anggaran</p>
              <a href="/budgets" className="text-primary-600 hover:underline text-xs mt-1 inline-block">
                Buat anggaran →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.slice(0, 5).map(b => {
                const pct = safePercent(b.spent, b.limit_amount)
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        {b.categories?.icon} {b.categories?.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRupiah(b.spent, { compact: true })} / {formatRupiah(b.limit_amount, { compact: true })}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${budgetColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {budgets.length > 5 && (
                <a href="/budgets" className="text-xs text-primary-600 hover:underline">
                  Lihat semua ({budgets.length}) →
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Transaksi Terbaru</h2>
          <a href="/transactions" className="text-xs text-primary-600 hover:underline">
            Lihat semua →
          </a>
        </div>
        <TransactionList
          transactions={transactions.slice(0, 10)}
          loading={loading}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
        />
      </div>

      {/* Add transaction modal */}
      {showForm && (
        <TransactionForm
          onSubmit={addTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
