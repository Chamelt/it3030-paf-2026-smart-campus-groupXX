// Feature branch: feature/E-auth-context-axios
// Global authentication state for the React app.
// Exposes: user, loading, loginWithToken (called after OAuth2 redirect),
//          logout, isAdmin, isTechnician.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — if a token exists, fetch the current user profile
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    axiosInstance.get('/api/users/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Called by OAuth2RedirectPage after receiving the token from the URL
  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('token', token)
    const res = await axiosInstance.get('/api/users/me')
    setUser(res.data)
  }, [])

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/api/auth/logout')
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [])

  const isAdmin       = user?.role === 'ADMIN'
  const isTechnician  = user?.role === 'TECHNICIAN'

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout, isAdmin, isTechnician }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
