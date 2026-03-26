import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Default categories seeded on first login
const DEFAULT_CATEGORIES = [
  { name: 'Gaji',         type: 'income',  icon: '💼', color: '#22c55e' },
  { name: 'Freelance',    type: 'income',  icon: '💻', color: '#10b981' },
  { name: 'Investasi',    type: 'income',  icon: '📈', color: '#06b6d4' },
  { name: 'Makanan',      type: 'expense', icon: '🍜', color: '#f97316' },
  { name: 'Transport',    type: 'expense', icon: '🚗', color: '#3b82f6' },
  { name: 'Belanja',      type: 'expense', icon: '🛍️', color: '#a855f7' },
  { name: 'Hiburan',      type: 'expense', icon: '🎮', color: '#ec4899' },
  { name: 'Kesehatan',    type: 'expense', icon: '🏥', color: '#ef4444' },
  { name: 'Pendidikan',   type: 'expense', icon: '📚', color: '#8b5cf6' },
  { name: 'Utilitas',     type: 'expense', icon: '⚡', color: '#eab308' },
  { name: 'Tabungan',     type: 'expense', icon: '🏦', color: '#14b8a6' },
  { name: 'Lainnya',      type: 'expense', icon: '📦', color: '#6b7280' },
]

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchCategories()
  }, [user])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) {
      console.error(error)
      return
    }

    // Seed default categories if user has none
    if (data.length === 0) {
      await seedDefaultCategories()
    } else {
      setCategories(data)
    }
    setLoading(false)
  }

  const seedDefaultCategories = async () => {
    const rows = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id }))
    const { data, error } = await supabase
      .from('categories')
      .insert(rows)
      .select()

    if (!error) setCategories(data)
    setLoading(false)
  }

  const addCategory = async ({ name, type, icon, color }) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, type, icon, color, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const incomeCategories  = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return { categories, incomeCategories, expenseCategories, loading, addCategory }
}
