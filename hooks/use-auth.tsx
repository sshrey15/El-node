"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { AuthService, type User } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  canEdit: () => boolean
  hasRole: (role: "admin" | "viewer") => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const authService = AuthService.getInstance()

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const result = authService.login(username, password)
    if (result.success && result.user) {
      setUser(result.user)
      setIsAuthenticated(true)
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const canEdit = () => authService.canEdit()
  const hasRole = (role: "admin" | "viewer") => authService.hasRole(role)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        canEdit,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
