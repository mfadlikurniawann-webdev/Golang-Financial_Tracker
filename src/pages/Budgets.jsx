import { useState } from 'react'
import { subMonths, addMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { formatRupiah, budgetColor, safePercent } from '../lib/utils'

function AddBudgetForm({ onSubmit, onClose, existingCategoryIds }) {
  const { expenseCategories, loading } = useCategories()
  const [categoryId, setCategoryId]   = useState('')
  const [limitAmount, setLimitAmount] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)

  const available = expenseCategories.filter(c => !existingCategoryIds.includes(c.id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!categoryId || !limitAmount) { setError('Lengkapi semua field.'); return }
    setSaving(true)
    try {
      await onSubmit({ category_id: categoryId, limit_amount: limitAmount })
      onClose()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tambah Anggaran</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Kategori *</label>
            {loading ? <div className="input animate-pulse text-gray-300">Memuat...</div> : (
              available.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Semua kategori sudah punya anggaran bulan ini.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto py-1">
                  {available.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        categoryId === cat.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="text-xl leading-none">{cat.icon}</span>
                      <span className="truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
          <div>
            <label className="label">Batas Anggaran *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
              <input type="text" inputMode="numeric" className="input pl-10 text-right font-semibold"
                placeholder="0"
                value={limitAmount ? new Intl.NumberFormat('id-ID').format(parseInt(limitAmount.replace(/\D/g,'')||0)) : ''}
                onChange={e => setLimitAmount(e.target.value.replace(/\D/g,''))}
                required
              />
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Budgets() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm]         = useState(false)
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: localeId })

  const { budgets, loading, totalBudget, totalSpent, addBudget, deleteBudget } = useBudgets(currentMonth)

  const overallPct = safePercent(totalSpent, totalBudget)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anggaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Atur batas pengeluaran per kategori</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-secondary px-3 py-2">←</button>
          <span className="text-sm font-medium text-gray-700 min-w-[130px] text-center capitalize">{monthLabel}</span>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            disabled={format(addMonths(currentMonth, 1), 'yyyy-MM') > format(new Date(), 'yyyy-MM')}
            className="btn-secondary px-3 py-2 disabled:opacity-40"
          >→</button>
          <button onClick={() => setShowForm(true)} className="btn-primary ml-2 flex items-center gap-2">
            <span>+</span> Anggaran
          </button>
        </div>
      </div>

      {/* Overall summary card */}
      {budgets.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Total Anggaran Bulan Ini</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatRupiah(totalSpent)} dari {formatRupiah(totalBudget)}
              </p>
            </div>
            <div className={`text-2xl font-bold ${overallPct >= 90 ? 'text-red-600' : overallPct >= 75 ? 'text-yellow-600' : 'text-primary-600'}`}>
              {overallPct}%
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetColor(overallPct)}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Sisa: {formatRupiah(Math.max(totalBudget - totalSpent, 0))}
            {totalSpent > totalBudget && (
              <span className="text-red-500 ml-1">⚠️ Melebihi anggaran!</span>
            )}
          </p>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4"/>
                  <div className="h-2 bg-gray-100 rounded w-1/3"/>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full"/>
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">🎯</div>
          <p className="font-medium">Belum ada anggaran</p>
          <p className="text-sm mt-1">Tambah anggaran untuk mulai mengontrol pengeluaran</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            + Buat Anggaran Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map(b => {
            const pct = safePercent(b.spent, b.limit_amount)
            const remaining = b.limit_amount - b.spent
            const isOver = b.spent > b.limit_amount

            return (
              <div key={b.id} className={`card p-5 ${isOver ? 'border-red-200' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: b.categories?.color + '20' }}
                    >
                      {b.categories?.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{b.categories?.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatRupiah(b.spent, { compact: true })} / {formatRupiah(b.limit_amount, { compact: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-yellow-600' : 'text-primary-600'}`}>
                      {pct}%
                    </span>
                    <button
                      onClick={() => deleteBudget(b.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors text-lg"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${budgetColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className={`text-xs ${isOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {isOver
                    ? `⚠️ Melebihi ${formatRupiah(Math.abs(remaining), { compact: true })}`
                    : `Sisa ${formatRupiah(remaining, { compact: true })}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <AddBudgetForm
          onSubmit={addBudget}
          onClose={() => setShowForm(false)}
          existingCategoryIds={budgets.map(b => b.category_id)}
        />
      )}
    </div>
  )
}
