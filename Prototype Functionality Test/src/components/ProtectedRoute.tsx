import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/authContext'
import { roleHome, type Role } from '../auth/users'

interface Props {
  allowedRoles: Role[]
  children: ReactNode
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />

  return <>{children}</>
}