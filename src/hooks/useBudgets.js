import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export function useBudgets(monthDate = new Date()) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const month = format(monthDate, 'yyyy-MM')

  const fetchBudgets = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // Fetch budgets for this month
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*, categories(name, color, icon)')
      .eq('user_id', user.id)
      .eq('month', month)

    if (budgetError) { setLoading(false); return }

    // Fetch actual spending per category this month
    const from = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const to   = format(endOfMonth(monthDate),   'yyyy-MM-dd')

    const { data: txData } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', from)
      .lte('date', to)

    // Aggregate spending by category
    const spendMap = {}
    txData?.forEach(tx => {
      spendMap[tx.category_id] = (spendMap[tx.category_id] || 0) + tx.amount
    })

    // Merge budget with actual spending
    const merged = budgetData.map(b => ({
      ...b,
      spent: spendMap[b.category_id] || 0,
      percentage: Math.min(
        Math.round(((spendMap[b.category_id] || 0) / b.limit_amount) * 100),
        100
      ),
    }))

    setBudgets(merged)
    setLoading(false)
  }, [user, month])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const addBudget = async ({ category_id, limit_amount }) => {
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        user_id: user.id,
        category_id,
        limit_amount: parseFloat(limit_amount),
        month,
      }, { onConflict: 'user_id,category_id,month' })
      .select('*, categories(name, color, icon)')
      .single()

    if (error) throw error
    await fetchBudgets()
    return data
  }

  const deleteBudget = async (id) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) throw error
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  const totalBudget  = budgets.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent   = budgets.reduce((s, b) => s + b.spent, 0)

  return { budgets, loading, totalBudget, totalSpent, addBudget, deleteBudget, refetch: fetchBudgets }
}
