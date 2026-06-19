import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // On mount, restore user from stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        // Check expiry
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        } else {
          setUser({
            id: decoded.sub || decoded.id || decoded.nameid,
            email: decoded.email,
            name: decoded.name || decoded.unique_name || decoded.email,
            role: decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
            organizationId: decoded.organizationId,
            dealerId: decoded.dealerId,
          })
          setToken(storedToken)
        }
      } catch (err) {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password })
    const { token: newToken, role, name, organizationId, dealerId } = response.data

    localStorage.setItem('token', newToken)
    setToken(newToken)

    let decoded = {}
    try {
      decoded = jwtDecode(newToken)
    } catch {
      // fallback to response data
    }

    const userData = {
      id: decoded.sub || decoded.id || decoded.nameid,
      email: decoded.email || email,
      name: name || decoded.name || decoded.unique_name || email,
      role: role || decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      organizationId: organizationId || decoded.organizationId,
      dealerId: dealerId || decoded.dealerId,
    }

    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }, [])

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
