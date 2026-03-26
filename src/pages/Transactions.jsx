import { useState, useMemo } from 'react'
import { subMonths, addMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useTransactions } from '../hooks/useTransactions'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { formatRupiah } from '../lib/utils'

export default function Transactions() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm]         = useState(false)
  const [search, setSearch]             = useState('')
  const [filterType, setFilterType]     = useState('all') // 'all' | 'income' | 'expense'

  const { transactions, loading, summary, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions(currentMonth)

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: localeId })

  // Filter & search
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchType   = filterType === 'all' || tx.type === filterType
      const matchSearch = !search ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.categories?.name.toLowerCase().includes(search.toLowerCase())
      return matchType && matchSearch
    })
  }, [transactions, filterType, search])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{transactions.length} transaksi bulan ini</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="btn-secondary px-3 py-2"
          >←</button>
          <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            disabled={format(addMonths(currentMonth, 1), 'yyyy-MM') > format(new Date(), 'yyyy-MM')}
            className="btn-secondary px-3 py-2 disabled:opacity-40"
          >→</button>
          <button onClick={() => setShowForm(true)} className="btn-primary ml-2 flex items-center gap-2">
            <span>+</span> Tambah
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pemasukan', value: summary.income, color: 'text-green-600' },
          { label: 'Pengeluaran', value: summary.expense, color: 'text-red-500' },
          { label: 'Saldo', value: summary.balance, color: summary.balance >= 0 ? 'text-gray-900' : 'text-red-600' },
        ].map(m => (
          <div key={m.label} className="card p-4">
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${m.color}`}>
              {formatRupiah(m.value, { compact: true })}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            className="input pl-9"
            placeholder="Cari transaksi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >✕</button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
          {[
            { value: 'all',     label: 'Semua' },
            { value: 'income',  label: 'Masuk' },
            { value: 'expense', label: 'Keluar' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                filterType === f.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-gray-500">
          Menampilkan {filtered.length} dari {transactions.length} transaksi
        </p>
      )}

      {/* List */}
      <div className="card p-5">
        <TransactionList
          transactions={filtered}
          loading={loading}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
        />
      </div>

      {showForm && (
        <TransactionForm
          onSubmit={addTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
