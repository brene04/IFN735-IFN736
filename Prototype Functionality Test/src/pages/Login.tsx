import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import dostLogo from '../assets/logo_dost.png'
import { useAuth } from '../auth/authContext'
import { roleHome } from '../auth/users'

const NAVY = '#16233f'
const ACCENT = '#4FA3E3'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')     // ← moved inside
  const { login } = useAuth()                // ← moved inside
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const user = login(email, password)
    if (!user) {
      setError('Incorrect Employee ID/email or password.')
      return
    }
    navigate(roleHome[user.role])
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      {/* Left panel */}
      <div
        style={{
          width: '38%',
          minWidth: '340px',
          background: NAVY,
          color: 'white',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img src={dostLogo} alt="DOST logo" style={{ width: 48, height: 48, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>Department of Science and Technology</div>
            <div style={{ fontSize: '12.5px', fontStyle: 'italic', color: '#cbd5e1', marginTop: '2px' }}>
              Competency Based Human Resource Management System
            </div>
          </div>
        </div>

        <div>
          <div style={{ width: '48px', height: '3px', background: ACCENT, marginBottom: '20px' }} />
          <h1 style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.25, margin: '0 0 16px', color: 'white' }}>
            Competency Based
            <br />
            Human Resource (CBHR) System
          </h1>
          <p style={{ fontSize: '14px', fontStyle: 'italic', color: '#b9c4d4', lineHeight: 1.6, margin: 0 }}>
            Commitments, monitoring, coaching and year-end rating for all DOST offices, councils
            and regional field units.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          flex: 1,
          background: '#f6f7fa',
          backgroundImage:
            'linear-gradient(#e8eaef 1px, transparent 1px), linear-gradient(90deg, #e8eaef 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleSubmit} style={{ width: '460px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: 14, height: 14, background: ACCENT, display: 'inline-block' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', color: '#1a1a2e' }}>
                AUTHORIZED PERSONNEL ONLY
              </span>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 700, color: NAVY, margin: '0 0 10px' }}>Sign in to CBHR</h2>
            <p style={{ fontSize: '13.5px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 28px' }}>
              Use your DOST-issued account. Accounts are provisioned by your HRMD focal person.
            </p>

            <label style={{ fontSize: '12.5px', fontWeight: 600, color: NAVY }}>
              Employee ID or DOST email <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="example@dost.gov.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 14px',
                margin: '8px 0 18px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                background: 'white',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: NAVY }}>Password</label>
            </div>

            <input
              type="password"
              placeholder="•••••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 14px',
                margin: '8px 0 18px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                background: 'white',
              }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '22px' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember this authorised system
            </label>

            {error && <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                background: NAVY,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', padding: '20px' }}>
          Need help? ICTMS Service Desk &middot; local 2026 &middot; servicedesk@dost.gov.ph
        </div>
      </div>
    </div>
  )
}
