import { useState, useMemo } from 'react'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Sector
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatRupiah, safePercent } from '../lib/utils'
import { useEffect } from 'react'

// ── Helpers ─────────────────────────────────────────────────────────────
const MONTHS_COUNT = 6

function CustomTooltipBar({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-medium" style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value, { compact: true })}
        </p>
      ))}
    </div>
  )
}

function CustomTooltipPie({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700">{d.name}</p>
      <p className="text-gray-500">{formatRupiah(d.value)}</p>
      <p className="text-gray-400">{d.payload.pct}%</p>
    </div>
  )
}

// Active pie slice animation
function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#111" className="text-sm font-semibold" fontSize={13} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  )
}

// ── Main component ───────────────────────────────────────────────────────
export default function Reports() {
  const { user } = useAuth()
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePieIndex, setActivePieIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'categories' | 'trend'

  useEffect(() => {
    if (user) fetchReportData()
  }, [user])

  const fetchReportData = async () => {
    setLoading(true)
    const months = Array.from({ length: MONTHS_COUNT }, (_, i) =>
      subMonths(new Date(), MONTHS_COUNT - 1 - i)
    )

    // Fetch last 6 months of data in one query
    const from = format(startOfMonth(months[0]), 'yyyy-MM-dd')
    const to   = format(endOfMonth(months[months.length - 1]), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type, date, category_id, categories(name, color, icon)')
      .eq('user_id', user.id)
      .gte('date', from)
      .lte('date', to)

    if (error) { setLoading(false); return }

    // ── Monthly aggregation ────────────────────────────────────────────
    const monthly = months.map(m => {
      const key  = format(m, 'yyyy-MM')
      const txs  = data.filter(tx => tx.date.slice(0, 7) === key)
      const income  = txs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return {
        name: format(m, 'MMM', { locale: localeId }),
        Pemasukan: income,
        Pengeluaran: expense,
        Tabungan: Math.max(income - expense, 0),
      }
    })
    setMonthlyData(monthly)

    // ── Category breakdown (current + last month) ──────────────────────
    const currentMonthKey = format(new Date(), 'yyyy-MM')
    const currentTxs = data.filter(
      tx => tx.type === 'expense' && tx.date.slice(0, 7) === currentMonthKey
    )
    const catMap = {}
    currentTxs.forEach(tx => {
      const name  = tx.categories?.name  ?? 'Lainnya'
      const color = tx.categories?.color ?? '#6b7280'
      const icon  = tx.categories?.icon  ?? '📦'
      if (!catMap[name]) catMap[name] = { name, color, icon, value: 0 }
      catMap[name].value += tx.amount
    })
    const totalExpense = Object.values(catMap).reduce((s, c) => s + c.value, 0)
    const cats = Object.values(catMap)
      .sort((a, b) => b.value - a.value)
      .map(c => ({ ...c, pct: safePercent(c.value, totalExpense) }))
    setCategoryData(cats)

    setLoading(false)
  }

  // Savings rate for current month
  const currentMonth = monthlyData[monthlyData.length - 1]
  const savingsRate = currentMonth
    ? safePercent(currentMonth.Tabungan, currentMonth.Pemasukan)
    : 0

  // Net worth trend (cumulative)
  const netWorthTrend = useMemo(() => {
    let cumulative = 0
    return monthlyData.map(m => {
      cumulative += m.Pemasukan - m.Pengeluaran
      return { name: m.name, 'Kekayaan Bersih': cumulative }
    })
  }, [monthlyData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse"/>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-64 animate-pulse bg-gray-50"/>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MONTHS_COUNT} bulan terakhir</p>
        </div>
        <button
          onClick={fetchReportData}
          className="btn-secondary flex items-center gap-2 text-xs"
        >
          ↻ Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Rata-rata Pemasukan',
            value: formatRupiah(monthlyData.reduce((s,m) => s + m.Pemasukan, 0) / (monthlyData.length || 1), { compact: true }),
            icon: '📈', color: 'text-green-600'
          },
          {
            label: 'Rata-rata Pengeluaran',
            value: formatRupiah(monthlyData.reduce((s,m) => s + m.Pengeluaran, 0) / (monthlyData.length || 1), { compact: true }),
            icon: '📉', color: 'text-red-500'
          },
          {
            label: 'Tingkat Tabungan',
            value: `${savingsRate}%`,
            icon: '🏦', color: savingsRate >= 20 ? 'text-primary-600' : 'text-yellow-600'
          },
          {
            label: 'Kategori Terbesar',
            value: categoryData[0] ? `${categoryData[0].icon} ${categoryData[0].name}` : '-',
            icon: '🎯', color: 'text-gray-700'
          },
        ].map(k => (
          <div key={k.label} className="metric-card">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className={`text-base font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: 'overview',    label: 'Ikhtisar' },
          { id: 'categories',  label: 'Kategori' },
          { id: 'trend',       label: 'Tren' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Grouped bar chart */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pemasukan vs Pengeluaran (6 Bulan)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => formatRupiah(v, { compact: true })} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={64}/>
                <Tooltip content={<CustomTooltipBar />}/>
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }}/>
                <Bar dataKey="Pemasukan"   fill="#22c55e" radius={[4,4,0,0]} maxBarSize={40}/>
                <Bar dataKey="Pengeluaran" fill="#f87171" radius={[4,4,0,0]} maxBarSize={40}/>
                <Bar dataKey="Tabungan"    fill="#60a5fa" radius={[4,4,0,0]} maxBarSize={40}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ───────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut chart */}
          <div className="card p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Pengeluaran per Kategori — {format(new Date(), 'MMMM yyyy', { locale: localeId })}
            </h2>
            {categoryData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Belum ada data pengeluaran bulan ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={100}
                    dataKey="value"
                    activeIndex={activePieIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none"/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown list */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Rincian Kategori</h2>
            {categoryData.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <div className="space-y-3">
                {categoryData.map((cat, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{cat.icon}</span>
                        <span className="font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-800">
                          {formatRupiah(cat.value, { compact: true })}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{cat.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TREND TAB ────────────────────────────────────────────────── */}
      {activeTab === 'trend' && (
        <div className="space-y-4">
          {/* Net worth line chart */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Tren Kekayaan Bersih</h2>
            <p className="text-xs text-gray-400 mb-4">Akumulasi (pemasukan − pengeluaran)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={netWorthTrend} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => formatRupiah(v, { compact: true })} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={64}/>
                <Tooltip content={<CustomTooltipBar />}/>
                <Line
                  type="monotone"
                  dataKey="Kekayaan Bersih"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Savings rate per month */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Tingkat Tabungan per Bulan</h2>
            <div className="space-y-3">
              {monthlyData.map((m, i) => {
                const rate = safePercent(m.Tabungan, m.Pemasukan)
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600 capitalize">{m.name}</span>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${rate >= 20 ? 'text-primary-600' : rate >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {rate}%
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatRupiah(m.Tabungan, { compact: true })} tersimpan
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${rate >= 20 ? 'bg-primary-500' : rate >= 10 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
              💡 <strong>Aturan 50/30/20:</strong> Idealnya 20% penghasilan masuk tabungan.
              {savingsRate >= 20
                ? ` Kamu sudah di atas target! 🎉`
                : ` Target kamu: ${formatRupiah(currentMonth ? currentMonth.Pemasukan * 0.2 : 0, { compact: true })} / bulan.`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
