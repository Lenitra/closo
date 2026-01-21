import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../services/api'
import type { User, LoginCredentials, RegisterData } from '../types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api
        .getCurrentUser()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          // Token invalide ou expiré
          localStorage.removeItem('access_token')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials)
    localStorage.setItem('access_token', response.access_token)

    // Récupérer les infos utilisateur
    const userData = await api.getCurrentUser()
    setUser(userData)
  }

  const register = async (data: RegisterData) => {
    const response = await api.register(data)
    localStorage.setItem('access_token', response.access_token)

    if (response.user) {
      setUser(response.user)
    } else {
      // Si l'API ne retourne pas l'utilisateur, le récupérer
      const userData = await api.getCurrentUser()
      setUser(userData)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
