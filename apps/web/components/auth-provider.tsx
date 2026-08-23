'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { loginApi, API_URL } from '@/lib/api'

type User = { sub: string, email: string, role: string, id?: string }
type RegisterData = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}
type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password?: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
  }, [])

  const login = async (email: string, password?: string) => {
    const data = await loginApi(email, password)
    setToken(data.access_token)
    try {
      const payload = JSON.parse(atob(data.access_token.split('.')[1]))
      const userData = { sub: payload.sub, email: payload.email, role: payload.role, id: payload.sub }
      setUser(userData)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch {
      logout()
      throw new Error('Invalid authentication token received')
    }
  }

  const register = async (registerData: RegisterData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()
    setToken(data.access_token)
    try {
      const payload = JSON.parse(atob(data.access_token.split('.')[1]))
      const userData = { sub: payload.sub, email: payload.email, role: payload.role, id: payload.sub }
      setUser(userData)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch {
      logout()
      throw new Error('Invalid authentication token received')
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
