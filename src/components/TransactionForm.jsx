import { useState, useEffect } from 'react'
import { useCategories } from '../hooks/useCategories'
import { format } from 'date-fns'

export default function TransactionForm({ onSubmit, onClose, initialData = null }) {
  const { incomeCategories, expenseCategories, loading: catLoading } = useCategories()

  const [type, setType]           = useState(initialData?.type ?? 'expense')
  const [amount, setAmount]       = useState(initialData?.amount?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [date, setDate]           = useState(initialData?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const categories = type === 'income' ? incomeCategories : expenseCategories

  // Reset category when type changes
  useEffect(() => {
    if (!initialData) setCategoryId('')
  }, [type])

  const handleAmountChange = (e) => {
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, '')
    setAmount(val)
  }

  const formatDisplayAmount = (raw) => {
    if (!raw) return ''
    return new Intl.NumberFormat('id-ID').format(parseInt(raw))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || !categoryId || !date) {
      setError('Lengkapi semua field yang wajib diisi.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await onSubmit({ type, amount, category_id: categoryId, description, date })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              { value: 'expense', label: 'Pengeluaran', color: 'text-red-600' },
              { value: 'income',  label: 'Pemasukan',   color: 'text-green-600' },
            ].map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === t.value
                    ? `bg-white shadow-sm ${t.color}`
                    : 'text-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="label">Jumlah *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="input pl-10 text-right text-lg font-semibold"
                placeholder="0"
                value={formatDisplayAmount(amount)}
                onChange={handleAmountChange}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Kategori *</label>
            {catLoading ? (
              <div className="input text-gray-400 animate-pulse">Memuat kategori...</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto py-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
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
            )}
          </div>

          {/* Date */}
          <div>
            <label className="label">Tanggal *</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Catatan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input
              type="text"
              className="input"
              placeholder="Contoh: makan siang kantor"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white transition-all ${
                type === 'income'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50`}
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {initialData ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
