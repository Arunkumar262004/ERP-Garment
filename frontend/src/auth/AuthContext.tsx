import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('erp_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('erp_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get<User>('/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('erp_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('erp_token')
        localStorage.removeItem('erp_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/login', { email, password })
    localStorage.setItem('erp_token', res.data.token)
    localStorage.setItem('erp_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      setUser(null)
    }
  }

  const updateUser = (nextUser: User) => {
    setUser(nextUser)
    localStorage.setItem('erp_user', JSON.stringify(nextUser))
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
