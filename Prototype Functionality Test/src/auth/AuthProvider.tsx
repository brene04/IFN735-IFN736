import { useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './authContext'
import { mockUsers } from './users'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = sessionStorage.getItem('cbhr_user')
    return saved ? (JSON.parse(saved) as AuthUser) : null
  })

  function login(email: string, password: string) {
    const match = mockUsers.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    )
    if (!match) return null
    const authUser: AuthUser = { name: match.name, role: match.role }
    sessionStorage.setItem('cbhr_user', JSON.stringify(authUser))
    setUser(authUser)
    return authUser
  }

  function logout() {
    sessionStorage.removeItem('cbhr_user')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}