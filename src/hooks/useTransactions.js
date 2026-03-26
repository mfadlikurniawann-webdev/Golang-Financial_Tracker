import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export function useTransactions(monthDate = new Date()) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const from = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const to   = format(endOfMonth(monthDate),   'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, color, icon)')
      .eq('user_id', user.id)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTransactions(data)
    }
    setLoading(false)
  }, [user, monthDate.getMonth(), monthDate.getFullYear()])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // ── CREATE ──────────────────────────────────────────────
  const addTransaction = async ({ amount, type, category_id, description, date }) => {
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        type,
        category_id,
        description,
        date,
      })
      .select('*, categories(name, color, icon)')
      .single()

    if (error) throw error

    // Optimistic update: prepend to local state
    setTransactions(prev => [data, ...prev])
    return data
  }

  // ── UPDATE ──────────────────────────────────────────────
  const updateTransaction = async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updates,
        amount: parseFloat(updates.amount),
      })
      .eq('id', id)
      .select('*, categories(name, color, icon)')
      .single()

    if (error) throw error

    setTransactions(prev =>
      prev.map(tx => tx.id === id ? data : tx)
    )
    return data
  }

  // ── DELETE ──────────────────────────────────────────────
  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error

    setTransactions(prev => prev.filter(tx => tx.id !== id))
  }

  // ── COMPUTED SUMMARY ────────────────────────────────────
  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income')  acc.income  += tx.amount
      if (tx.type === 'expense') acc.expense += tx.amount
      return acc
    },
    { income: 0, expense: 0 }
  )
  summary.balance = summary.income - summary.expense

  return {
    transactions,
    loading,
    error,
    summary,
    refetch: fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
