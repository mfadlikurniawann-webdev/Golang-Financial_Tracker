import { useState } from 'react'
import { formatRupiah, formatDate, groupByDate } from '../lib/utils'
import TransactionForm from './TransactionForm'

function TransactionItem({ tx, onDelete, onEdit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isIncome = tx.type === 'income'

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-xl group transition-colors">
      {/* Category icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: tx.categories?.color + '20' }}
      >
        {tx.categories?.icon ?? '💸'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {tx.description || tx.categories?.name || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
        </p>
        <p className="text-xs text-gray-400">{tx.categories?.name}</p>
      </div>

      {/* Amount */}
      <div className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
        {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
      </div>

      {/* Actions menu */}
      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 text-lg"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[130px]">
              <button
                onClick={() => { setMenuOpen(false); onEdit(tx) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(tx.id) }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                🗑️ Hapus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function TransactionList({ transactions, onUpdate, onDelete, loading }) {
  const [editingTx, setEditingTx] = useState(null)

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-2 bg-gray-100 rounded w-1/5" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-sm font-medium">Belum ada transaksi</p>
        <p className="text-xs mt-1">Tambah transaksi pertamamu!</p>
      </div>
    )
  }

  const grouped = groupByDate(transactions)

  return (
    <>
      <div className="space-y-4">
        {grouped.map(([dateStr, txs]) => {
          const dayTotal = txs.reduce((sum, tx) => {
            return sum + (tx.type === 'income' ? tx.amount : -tx.amount)
          }, 0)

          return (
            <div key={dateStr}>
              {/* Date header */}
              <div className="flex items-center justify-between mb-1 px-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {formatDate(dateStr, 'EEEE, d MMM')}
                </span>
                <span className={`text-xs font-semibold tabular-nums ${dayTotal >= 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  {dayTotal >= 0 ? '+' : ''}{formatRupiah(dayTotal)}
                </span>
              </div>

              {/* Transaction items */}
              <div className="card divide-y divide-gray-50">
                {txs.map(tx => (
                  <TransactionItem
                    key={tx.id}
                    tx={tx}
                    onEdit={setEditingTx}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editingTx && (
        <TransactionForm
          initialData={editingTx}
          onSubmit={(data) => onUpdate(editingTx.id, data)}
          onClose={() => setEditingTx(null)}
        />
      )}
    </>
  )
}
