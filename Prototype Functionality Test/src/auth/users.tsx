export type Role = 'executive' | 'technical_admin' | 'administrative_admin' | 'concerned_office'

export interface MockUser {
  email: string
  password: string
  role: Role
  name: string
}

// test accounts for the prototype only
export const mockUsers: MockUser[] = [
  { email: 'executive@dost.gov.ph', password: 'password123', role: 'executive', name: 'Executive User' },
  { email: 'tech.admin@dost.gov.ph', password: 'password123', role: 'technical_admin', name: 'Technical Admin' },
  { email: 'admin@dost.gov.ph', password: 'password123', role: 'administrative_admin', name: 'Admin User' },
  { email: 'office@dost.gov.ph', password: 'password123', role: 'concerned_office', name: 'Office User' },
]

// where each role lands after logging in
export const roleHome: Record<Role, string> = {
  executive: '/executive/dashboard',
  technical_admin: '/technical/dashboard',
  administrative_admin: '/admin/dashboard',
  concerned_office: '/office/dashboard',
}