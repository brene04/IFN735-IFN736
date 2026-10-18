// SYSTEM CONFIGURATION  (/technical/system-configuration?tab=general)
// System-wide settings. Edits are kept in a draft until "Save Changes" is clicked.
// Tabs: general · security · proficiency (tbl_proficiency_levels) · categories
// (tbl_competency_categories) · notifications · maintenance (mode, backups, reset).
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDb, save, resetDemoData, nextNumber, CURRENT_ACTOR } from './techData'
import type { SystemConfig } from './techData'
import { TechLayout, PageHeader, Card, Pill, Field, Notice, Icon, Toggle, Tabs, ConfirmModal } from './techUi'
import { NAVY, MUTED, BORDER, inputStyle, primaryBtn, smallPrimaryBtn, ghostBtn, dangerBtn, thStyle, tdStyle, errorBox, infoBox, formatDateTime, relativeTime, nowMs } from './techTheme'

type Tab = 'general' | 'security' | 'proficiency' | 'categories' | 'notifications' | 'maintenance'

const clone = (c: SystemConfig): SystemConfig => JSON.parse(JSON.stringify(c))
// Backups are saved straight away, so they are left out when checking for unsaved changes
const comparable = (c: SystemConfig) => JSON.stringify({ ...c, maintenance: { ...c.maintenance, backups: [] } })

// One setting row: label + help text on the left, control on the right
function SettingRow({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 340px)', gap: '20px', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f1f3' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{label}</div>
        {help && <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '2px' }}>{help}</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

export default function SystemConfigPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'general'
  const [draft, setDraft] = useState<SystemConfig>(() => clone(db.config))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const dirty = comparable(draft) !== comparable(db.config)
  const g = draft.general
  const s = draft.security
  const n = draft.notifications
  const m = draft.maintenance

  // small helpers to update one section of the draft
  const setGeneral = (patch: Partial<SystemConfig['general']>) => setDraft({ ...draft, general: { ...g, ...patch } })
  const setSecurity = (patch: Partial<SystemConfig['security']>) => setDraft({ ...draft, security: { ...s, ...patch } })
  const setNotif = (patch: Partial<SystemConfig['notifications']>) => setDraft({ ...draft, notifications: { ...n, ...patch } })
  const setMaint = (patch: Partial<SystemConfig['maintenance']>) => setDraft({ ...draft, maintenance: { ...m, ...patch } })

  function validate(): string {
    if (!g.systemName.trim()) return 'System name cannot be empty.'
    if (!/^\S+@\S+\.\S+$/.test(g.supportEmail)) return 'Support email is not a valid email address.'
    if (s.minPasswordLength < 8 || s.minPasswordLength > 64) return 'Minimum password length must be between 8 and 64.'
    if (s.maxFailedAttempts < 1 || s.maxFailedAttempts > 10) return 'Failed attempts before lock must be between 1 and 10.'
    if (s.sessionTimeoutMinutes < 5 || s.sessionTimeoutMinutes > 240) return 'Session timeout must be between 5 and 240 minutes.'
    if (s.passwordExpiryDays < 0 || s.passwordExpiryDays > 365) return 'Password expiry must be between 0 (never) and 365 days.'
    if (!s.allowedDomain.includes('.')) return 'Allowed email domain looks wrong (example: dost.gov.ph).'
    if (draft.proficiencyLevels.some((l) => !l.name.trim())) return 'Every proficiency level needs a name.'
    if (new Set(draft.proficiencyLevels.map((l) => l.name.trim().toLowerCase())).size !== draft.proficiencyLevels.length) return 'Proficiency level names must be different.'
    if (draft.categories.some((c) => !c.name.trim())) return 'Every competency category needs a name.'
    if (new Set(draft.categories.map((c) => c.name.trim().toLowerCase())).size !== draft.categories.length) return 'Competency category names must be different.'
    if (m.maintenanceMode && !m.message.trim()) return 'Add a maintenance message for users.'
    return ''
  }

  // Lists every changed setting for the audit log
  function describeChanges(): string[] {
    const out: string[] = []
    const before = db.config
    ;(Object.keys(g) as (keyof SystemConfig['general'])[]).forEach((k) => { if (g[k] !== before.general[k]) out.push(`General ${k}: ${before.general[k]} → ${g[k]}`) })
    ;(Object.keys(s) as (keyof SystemConfig['security'])[]).forEach((k) => { if (s[k] !== before.security[k]) out.push(`Security ${k}: ${before.security[k]} → ${s[k]}`) })
    ;(Object.keys(n) as (keyof SystemConfig['notifications'])[]).forEach((k) => { if (n[k] !== before.notifications[k]) out.push(`Notification ${k}: ${before.notifications[k] ? 'on' : 'off'} → ${n[k] ? 'on' : 'off'}`) })
    if (JSON.stringify(draft.proficiencyLevels) !== JSON.stringify(before.proficiencyLevels)) out.push('Proficiency levels updated')
    if (JSON.stringify(draft.categories) !== JSON.stringify(before.categories)) out.push('Competency categories updated')
    if (m.maintenanceMode !== before.maintenance.maintenanceMode) out.push(`Maintenance mode ${m.maintenanceMode ? 'ON' : 'OFF'}`)
    if (m.message !== before.maintenance.message || m.autoBackup !== before.maintenance.autoBackup) out.push('Maintenance settings updated')
    return out
  }

  function saveAll() {
    const problem = validate()
    if (problem) return setError(problem)
    const changes = describeChanges()
    save((d) => {
      d.config = { ...clone(draft), maintenance: { ...clone(draft).maintenance, backups: d.config.maintenance.backups } }
    }, { event: 'Config Change', details: changes.join('; ') })
    setError('')
    setNotice(`Configuration saved (${changes.length} change${changes.length === 1 ? '' : 's'}).`)
  }

  function backupNow() {
    const d = new Date(nowMs())
    const id = `BK-${d.toISOString().slice(0, 10).replace(/-/g, '')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
    save((x) => {
      x.config.maintenance.backups.unshift({ id, at: d.toISOString(), by: CURRENT_ACTOR.name, size: `${410 + x.config.maintenance.backups.length} MB`, type: 'Manual' })
    }, { event: 'Config Change', details: `Manual database backup ${id} created` })
    setNotice(`Backup ${id} created.`)
  }

  function doReset() {
    resetDemoData()
    setConfirmReset(false)
    setParams({ tab: 'maintenance' })
    window.location.reload() // re-load the page so every screen shows the fresh sample data
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'security', label: 'Security & Access' },
    { value: 'proficiency', label: 'Proficiency Levels' },
    { value: 'categories', label: 'Competency Categories' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'maintenance', label: 'Maintenance & Backup' },
  ]

  const num = (value: number, onChange: (v: number) => void, suffix: string) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input type="number" style={{ ...inputStyle, width: '110px' }} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span style={{ fontSize: '13px', color: MUTED, minWidth: '60px' }}>{suffix}</span>
    </span>
  )

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'System' }, { label: 'System Configuration' }]}
        title="System Configuration"
        description="System-wide settings for CB-HRMS: security policy, proficiency scale, competency categories, notifications and maintenance."
        actions={
          <>
            <button style={ghostBtn} disabled={!dirty} onClick={() => { setDraft(clone(db.config)); setError('') }}>Discard</button>
            <button style={{ ...primaryBtn, opacity: dirty ? 1 : 0.5 }} disabled={!dirty} onClick={saveAll}><Icon name="check" size={16} /> Save Changes</button>
          </>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}
      {error && <div style={errorBox}>{error}</div>}
      {dirty && (
        <div style={{ ...infoBox, background: '#fff6dd', borderColor: '#f6d98a', color: '#7a5000', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icon name="alert" size={16} /> You have unsaved changes. Click <strong>Save Changes</strong> to apply them.
        </div>
      )}

      <div style={{ marginBottom: '16px', background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '6px', width: 'fit-content', maxWidth: '100%' }}>
        <Tabs tabs={tabs} active={tab} onChange={(t) => setParams({ tab: t })} />
      </div>

      {tab === 'general' && (
        <Card title="General Settings" subtitle="Names and defaults shown across the system">
          <SettingRow label="System name"><input style={inputStyle} value={g.systemName} onChange={(e) => setGeneral({ systemName: e.target.value })} /></SettingRow>
          <SettingRow label="Agency"><input style={inputStyle} value={g.agency} onChange={(e) => setGeneral({ agency: e.target.value })} /></SettingRow>
          <SettingRow label="Fiscal year" help="Used for dashboards and reports"><select style={inputStyle} value={g.fiscalYear} onChange={(e) => setGeneral({ fiscalYear: e.target.value })}>{['2025', '2026', '2027'].map((y) => <option key={y}>{y}</option>)}</select></SettingRow>
          <SettingRow label="Assessment cycle" help="Shown as the default cycle filter"><select style={inputStyle} value={g.assessmentCycle} onChange={(e) => setGeneral({ assessmentCycle: e.target.value })}>{['FY 2025-2026', 'FY 2026-2027', 'FY 2027-2028'].map((y) => <option key={y}>{y}</option>)}</select></SettingRow>
          <SettingRow label="Time zone"><select style={inputStyle} value={g.timezone} onChange={(e) => setGeneral({ timezone: e.target.value })}><option>Asia/Manila (GMT+8)</option><option>UTC (GMT+0)</option></select></SettingRow>
          <SettingRow label="Support email" help="Shown on the login page footer"><input style={inputStyle} value={g.supportEmail} onChange={(e) => setGeneral({ supportEmail: e.target.value })} /></SettingRow>
        </Card>
      )}

      {tab === 'security' && (
        <Card title="Security & Access Policy" subtitle="Applies to every user account at next sign-in">
          <SettingRow label="Minimum password length" help="8-64 characters">{num(s.minPasswordLength, (v) => setSecurity({ minPasswordLength: v }), 'characters')}</SettingRow>
          <SettingRow label="Require complex passwords" help="Upper and lower case, a number and a symbol"><Toggle checked={s.requireComplexity} onChange={(v) => setSecurity({ requireComplexity: v })} label="Require complex passwords" /></SettingRow>
          <SettingRow label="Password expiry" help="0 = passwords never expire">{num(s.passwordExpiryDays, (v) => setSecurity({ passwordExpiryDays: v }), 'days')}</SettingRow>
          <SettingRow label="Failed sign-ins before lock" help="The account is locked until a Technical Administrator unlocks it">{num(s.maxFailedAttempts, (v) => setSecurity({ maxFailedAttempts: v }), 'attempts')}</SettingRow>
          <SettingRow label="Session timeout" help="Sign out after this many idle minutes">{num(s.sessionTimeoutMinutes, (v) => setSecurity({ sessionTimeoutMinutes: v }), 'minutes')}</SettingRow>
          <SettingRow label="Require two-factor authentication (2FA)" help="GovMail one-time code at every sign-in"><Toggle checked={s.require2FA} onChange={(v) => setSecurity({ require2FA: v })} label="Require 2FA" /></SettingRow>
          <SettingRow label="Allowed email domain" help="New accounts and employee emails must end with this"><input style={inputStyle} value={s.allowedDomain} onChange={(e) => setSecurity({ allowedDomain: e.target.value.trim() })} /></SettingRow>
        </Card>
      )}

      {tab === 'proficiency' && (
        <Card flush title="Proficiency Levels" subtitle="tbl_proficiency_levels · the 4-tier scale used for required, current and gap levels">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr><th style={{ ...thStyle, width: 90 }}>LEVEL</th><th style={{ ...thStyle, width: 220 }}>NAME</th><th style={thStyle}>DESCRIPTION</th><th style={{ ...thStyle, width: 120 }}>ACTIVE</th></tr></thead>
            <tbody>
              {draft.proficiencyLevels.map((l, i) => (
                <tr key={l.number}>
                  <td style={tdStyle}><span style={{ width: 32, height: 32, borderRadius: '8px', background: '#e6f5fc', color: '#0b4f73', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{l.number}</span></td>
                  <td style={tdStyle}><input style={inputStyle} value={l.name} aria-label={`Level ${l.number} name`} onChange={(e) => setDraft({ ...draft, proficiencyLevels: draft.proficiencyLevels.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} /></td>
                  <td style={tdStyle}><input style={inputStyle} value={l.description} aria-label={`Level ${l.number} description`} onChange={(e) => setDraft({ ...draft, proficiencyLevels: draft.proficiencyLevels.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)) })} /></td>
                  <td style={tdStyle}><Toggle checked={l.status === 'Active'} label={`Level ${l.number} active`} onChange={(v) => setDraft({ ...draft, proficiencyLevels: draft.proficiencyLevels.map((x, k) => (k === i ? { ...x, status: v ? 'Active' : 'Inactive' } : x)) })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '14px 22px', fontSize: '12.5px', color: MUTED }}>The number of levels is fixed at 4 by the DOST competency framework (ERD note 4). Rename or describe levels here; changes appear in Competency Management and Gap Analysis.</div>
        </Card>
      )}

      {tab === 'categories' && (
        <Card
          flush
          title="Competency Categories"
          subtitle="tbl_competency_categories · groups used in Competency Management"
          right={<button style={smallPrimaryBtn} onClick={() => setDraft({ ...draft, categories: [...draft.categories, { id: nextNumber(draft.categories.map((c) => c.id)), name: '', description: '', status: 'Active' }] })}><Icon name="plus" size={14} /> Add Category</button>}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr><th style={{ ...thStyle, width: 70 }}>ID</th><th style={{ ...thStyle, width: 220 }}>NAME</th><th style={thStyle}>DESCRIPTION</th><th style={{ ...thStyle, width: 110 }}>ACTIVE</th><th style={{ ...thStyle, width: 70 }} /></tr></thead>
            <tbody>
              {draft.categories.map((c, i) => {
                const saved = db.config.categories.some((x) => x.id === c.id)
                return (
                  <tr key={c.id}>
                    <td style={{ ...tdStyle, color: MUTED }}>{c.id}</td>
                    <td style={tdStyle}><input style={inputStyle} value={c.name} placeholder="Category name" aria-label="Category name" onChange={(e) => setDraft({ ...draft, categories: draft.categories.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} /></td>
                    <td style={tdStyle}><input style={inputStyle} value={c.description} aria-label="Category description" onChange={(e) => setDraft({ ...draft, categories: draft.categories.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)) })} /></td>
                    <td style={tdStyle}><Toggle checked={c.status === 'Active'} label={`${c.name} active`} onChange={(v) => setDraft({ ...draft, categories: draft.categories.map((x, k) => (k === i ? { ...x, status: v ? 'Active' : 'Inactive' } : x)) })} /></td>
                    <td style={tdStyle}>{!saved && <button aria-label="Remove new category" style={{ ...dangerBtn, padding: '6px 10px' }} onClick={() => setDraft({ ...draft, categories: draft.categories.filter((_, k) => k !== i) })}><Icon name="trash" size={14} /></button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ padding: '14px 22px', fontSize: '12.5px', color: MUTED }}>Saved categories cannot be deleted because competencies refer to them — set them inactive instead.</div>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card title="Email Notifications" subtitle="Automatic GovMail messages sent by the system">
          <SettingRow label="New user account" help="Send activation email to new users"><Toggle checked={n.newUser} onChange={(v) => setNotif({ newUser: v })} label="New user email" /></SettingRow>
          <SettingRow label="Role change" help="Tell users when their role changes"><Toggle checked={n.roleChange} onChange={(v) => setNotif({ roleChange: v })} label="Role change email" /></SettingRow>
          <SettingRow label="Profile update submitted" help="Alert Technical Administrators about new requests"><Toggle checked={n.profileUpdateSubmitted} onChange={(v) => setNotif({ profileUpdateSubmitted: v })} label="Profile update email" /></SettingRow>
          <SettingRow label="Technical issue updates" help="Email the reporter when their issue changes status"><Toggle checked={n.issueUpdate} onChange={(v) => setNotif({ issueUpdate: v })} label="Issue update email" /></SettingRow>
          <SettingRow label="Weekly security digest" help="Monday summary of failed sign-ins and locked accounts"><Toggle checked={n.weeklySecurityDigest} onChange={(v) => setNotif({ weeklySecurityDigest: v })} label="Weekly digest" /></SettingRow>
        </Card>
      )}

      {tab === 'maintenance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
          <Card title="Maintenance Mode" subtitle="Temporarily block sign-in for everyone except Technical Administrators">
            <SettingRow label="Maintenance mode" help={m.maintenanceMode ? 'ON after you save — users see the message below' : 'OFF — the system is open to all users'}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Pill text={m.maintenanceMode ? 'ON' : 'OFF'} tone={m.maintenanceMode ? 'warning' : 'success'} /><Toggle checked={m.maintenanceMode} onChange={(v) => setMaint({ maintenanceMode: v })} label="Maintenance mode" /></span>
            </SettingRow>
            <div style={{ paddingTop: '14px' }}>
              <Field label="Message shown to users"><textarea style={{ ...inputStyle, minHeight: '70px' }} value={m.message} onChange={(e) => setMaint({ message: e.target.value })} /></Field>
            </div>
          </Card>
          <Card title="Database Backup" subtitle={`Automatic schedule: ${m.autoBackup}`} right={<button style={smallPrimaryBtn} onClick={backupNow}><Icon name="download" size={14} /> Back Up Now</button>}>
            <SettingRow label="Automatic backup"><select style={inputStyle} value={m.autoBackup} onChange={(e) => setMaint({ autoBackup: e.target.value })}><option>Daily at 02:00 AM</option><option>Every 12 hours</option><option>Weekly (Sunday 02:00 AM)</option></select></SettingRow>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {db.config.maintenance.backups.slice(0, 6).map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px' }}>
                  <Icon name="server" size={15} />
                  <strong style={{ color: NAVY }}>{b.id}</strong>
                  <span style={{ color: MUTED, flex: 1 }}>{formatDateTime(b.at)} · {b.size} · {b.by}</span>
                  <Pill text={b.type} tone={b.type === 'Manual' ? 'accent' : 'neutral'} dot={false} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '8px' }}>Last backup {relativeTime(db.config.maintenance.backups[0]?.at ?? null).toLowerCase()}.</div>
          </Card>
          <Card title="Prototype Data" subtitle="For demos and testing only" style={{ gridColumn: '1 / -1', borderColor: '#f8caca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, fontSize: '13.5px', color: '#374151' }}>Changes you make in the Technical Admin pages are saved in this browser. Reset puts back the original sample users, roles, employees, logs, requests and issues.</div>
              <button style={{ ...dangerBtn, background: '#b91c1c', color: 'white', borderColor: '#b91c1c' }} onClick={() => setConfirmReset(true)}><Icon name="refresh" size={15} /> Reset Demo Data</button>
            </div>
          </Card>
        </div>
      )}

      {confirmReset && (
        <ConfirmModal
          title="Reset all demo data?"
          message="Every change made in the Technical Admin pages (users, roles, employees, logs, requests, issues and settings) will be replaced with the original sample data."
          confirmLabel="Reset Data"
          danger
          onConfirm={doReset}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </TechLayout>
  )
}
