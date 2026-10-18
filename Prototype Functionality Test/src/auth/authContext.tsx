import { createContext, useContext } from 'react'
import type { Role } from './users'

export interface AuthUser {
  name: string
  role: Role
}

export interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => AuthUser | null
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}