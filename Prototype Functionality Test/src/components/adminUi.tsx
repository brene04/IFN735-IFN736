// Small building blocks shared by the Administrative Admin / Executive management pages
// (Employee & Position Management, Office & Competency Management, Gap Analysis).
// They sit on top of the shared design system in pages/technical/techUi.tsx.
import type { CSSProperties, ReactNode } from 'react'
import { useAuth } from '../auth/authContext'
import { roleHome } from '../auth/users'
import { StatCard as TechStatCard } from '../pages/technical/techUi'
import type { IconName } from '../pages/technical/techUi'
import { NAVY, BORDER, MUTED } from '../pages/technical/techTheme'

export function Icon({ name }: { name: 'search' | 'bell' | 'building' | 'people' | 'gauge' | 'check' | 'list' | 'filter' | 'plus' }) {
  const paths: Record<string, ReactNode> = {
    search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
    bell: (<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
    building: (<><path d="M3 21h18" /><path d="M5 21V10l7-5 7 5v11" /><path d="M9 21v-6h6v6" /></>),
    people: (<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M15 20c0-2.2 1-4 3-4.6" /></>),
    gauge: (<><path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 12l4-4" /></>),
    check: (<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
    list: (<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>),
    filter: (<><path d="M3 5h18l-7 8v6l-4 2v-8z" /></>),
    plus: (<><path d="M12 5v14M5 12h14" /></>),
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

// Admin-page StatCard: the shared StatCard with the older icon names (same look as the Technical Admin / Concerned Office pages)
const statIcons: Record<string, IconName> = { building: 'server', people: 'users', gauge: 'dashboard', check: 'check' }
export function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: 'building' | 'people' | 'gauge' | 'check'; accent?: boolean }) {
  const text = label.toLowerCase().replace(/(^|[ .])([a-z])/g, (_m, a, b) => a + b.toUpperCase())
  return <TechStatCard label={text} value={value} icon={statIcons[icon]} tone={accent ? 'accent' : 'navy'} />
}

export function useHome() {
  const { user } = useAuth()
  return roleHome[user?.role ?? 'administrative_admin']
}

export function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string; border: string }> = {
    Active: { bg: '#e7f6ec', fg: '#15803d', border: '#c7ebd3' },
    Inactive: { bg: '#f3f4f6', fg: '#6b7280', border: '#e5e7eb' },
    Draft: { bg: '#fef6e4', fg: '#b45309', border: '#fde3b0' },
    Archived: { bg: '#f3f4f6', fg: '#6b7280', border: '#e5e7eb' },
    'On Leave': { bg: '#fef6e4', fg: '#b45309', border: '#fde3b0' },
    Separated: { bg: '#fdecec', fg: '#b91c1c', border: '#f8caca' },
    Filled: { bg: '#e7f6ec', fg: '#15803d', border: '#c7ebd3' },
    'Partially Filled': { bg: '#fef6e4', fg: '#b45309', border: '#fde3b0' },
    Vacant: { bg: '#fdecec', fg: '#b91c1c', border: '#f8caca' },
  }
  const c = colors[status] ?? colors.Inactive
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: c.bg, color: c.fg, border: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: '9px' }}>&#9679;</span>
      {status}
    </span>
  )
}

// Builds the page buttons, e.g. [1, 2, 3, '...', 5]
export function pageList(page: number, total: number): (number | '...')[] {
  const wanted = new Set([1, total, page - 1, page, page + 1])
  if (page <= 3) [1, 2, 3].forEach((n) => wanted.add(n))
  const nums = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const result: (number | '...')[] = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) result.push('...')
    result.push(n)
  })
  return result
}

export function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const box = (active: boolean, disabled = false): CSSProperties => ({
    minWidth: 34,
    height: 34,
    borderRadius: '6px',
    border: active ? 'none' : `1px solid ${BORDER}`,
    background: active ? '#0f2442' : 'white',
    color: active ? 'white' : disabled ? '#c4c8cf' : '#1f2937',
    fontSize: '14px',
    fontWeight: active ? 700 : 500,
    cursor: disabled ? 'default' : 'pointer',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <button style={box(false, page === 1)} disabled={page === 1} onClick={() => onChange(1)}>|&lsaquo;</button>
      <button style={box(false, page === 1)} disabled={page === 1} onClick={() => onChange(page - 1)}>&lsaquo;</button>
      {pageList(page, total).map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} style={{ padding: '0 4px', color: MUTED }}>...</span>
        ) : (
          <button key={p} style={box(p === page)} onClick={() => onChange(p)}>{p}</button>
        ),
      )}
      <button style={box(false, page === total)} disabled={page === total} onClick={() => onChange(page + 1)}>&rsaquo;</button>
      <button style={box(false, page === total)} disabled={page === total} onClick={() => onChange(total)}>&rsaquo;|</button>
    </div>
  )
}


export function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: active ? '#0f2442' : 'transparent', color: active ? 'white' : '#1f2937', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '14.5px', fontWeight: active ? 700 : 400, cursor: 'pointer' }}
    >
      {label} ({count})
    </button>
  )
}


// Big tab switch at the top of a combined page
export function PageTabs({ tabs, active, onChange }: { tabs: { key: string; label: string; count: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '6px', marginBottom: '26px', width: 'fit-content' }}>
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isActive ? NAVY : 'transparent', color: isActive ? 'white' : '#1f2937', border: 'none', borderRadius: '8px', padding: '11px 22px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
          >
            {t.label}
            <span style={{ background: isActive ? 'rgba(255,255,255,0.18)' : '#f1f0ee', color: isActive ? 'white' : MUTED, fontSize: '12px', padding: '2px 9px', borderRadius: '999px' }}>{t.count}</span>
          </button>
        )
      })}
    </div>
  )
}

