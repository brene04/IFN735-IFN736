// Shared colours, styles and small helpers for the Technical Admin pages.
// Same values as the other management pages so the whole system looks the same.
import type { CSSProperties } from 'react'

export const SIDEBAR = '#173761'
export const SIDEBAR_ACTIVE = '#1f4b7a'
export const NAVY = '#13305a'
export const ACCENT = '#0b5f8a'
export const BAR = '#2bb3ec'
export const BORDER = '#dfe3ea'
export const MUTED = '#6b7280'
export const HEAD_BG = '#f1f0ee'

// Chart colours (checked for colour-blind safety)
export const CHART_BLUE = '#2a78d6'
export const CHART_RED = '#d03b3b'

export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  fontSize: '13.5px',
  fontFamily: 'inherit',
  background: 'white',
}

export const selectStyle: CSSProperties = {
  padding: '10px 12px',
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  fontSize: '14px',
  background: 'white',
  color: '#1f2937',
  cursor: 'pointer',
  minWidth: '170px',
}

export const primaryBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: NAVY,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '11px 18px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
}

export const smallPrimaryBtn: CSSProperties = { ...primaryBtn, padding: '9px 16px', fontSize: '13px' }

export const ghostBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'white',
  color: '#374151',
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  padding: '9px 14px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

export const dangerBtn: CSSProperties = { ...ghostBtn, color: '#b91c1c', borderColor: '#fecaca' }

export const linkBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: ACCENT,
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'none',
}

// Small table buttons (the "View" / "Edit" buttons in each row)
export const rowBtn: CSSProperties = {
  background: ACCENT,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '7px 12px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export const rowGhostBtn: CSSProperties = {
  background: 'white',
  color: ACCENT,
  border: `1px solid ${ACCENT}`,
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

export const thStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '1px',
  color: '#1f2937',
  padding: '14px 16px',
  background: HEAD_BG,
  borderBottom: `1px solid ${BORDER}`,
  verticalAlign: 'middle', // headings wrap onto two lines when a table is tight (like the mockups)
}

export const tdStyle: CSSProperties = { padding: '14px 16px', borderBottom: '1px solid #eceef2', verticalAlign: 'middle' }

export const errorBox: CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '13px',
  marginBottom: '14px',
}

export const infoBox: CSSProperties = {
  background: '#eef6fb',
  border: '1px solid #bfdcef',
  color: '#0b3d5c',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13.5px',
}

/* ---------------- helpers ---------------- */

export function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

// "Today, 09:14 AM", "Yesterday, 4:02 PM" or a full date
export function relativeTime(iso: string | null) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const today = new Date()
  const days = Math.floor((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000)
  if (days === 0) return `Today, ${time}`
  if (days === 1) return `Yesterday, ${time}`
  if (days < 7) return `${days} days ago`
  return formatDate(iso)
}

// Current time (kept in a helper so pages can use it while drawing)
export function nowMs() {
  return Date.now()
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// Downloads a CSV file that opens in Excel
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Keeps a page number inside the valid range and returns the rows for that page
export function paginate<T>(rows: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const current = Math.min(page, totalPages)
  return {
    totalPages,
    current,
    rows: rows.slice((current - 1) * perPage, current * perPage),
    from: rows.length === 0 ? 0 : (current - 1) * perPage + 1,
    to: Math.min(current * perPage, rows.length),
  }
}
