// Office Management + Competency Management (one combined page)
// Address: /office-competency-management
//   ?tab=offices       -> tbl_offices                (hidden for the Administrative Admin)
//   ?tab=competencies  -> tbl_competencies + tbl_competency_categories + tbl_behavioral_indicators
// Reads and writes the shared database (pages/technical/techData).
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import RoleShell from '../../components/RoleShell'
import { Icon, StatCard, StatusPill, Pagination, TabButton, PageTabs, useHome } from '../../components/adminUi'
import { PageHeader, StatRow, Modal, Field, DetailRow, SearchBox } from '../technical/techUi'
import { inputStyle, selectStyle, primaryBtn, ghostBtn, dangerBtn, thStyle, tdStyle, errorBox, ACCENT, BORDER, MUTED } from '../technical/techTheme'
import { useDb, save, nextNumber } from '../technical/techData'
import type { OfficeRow, CompetencyRow, CompetencyStatus } from '../technical/techData'

const PER_PAGE = 20
const box = { background: 'white', border: `1px solid ${BORDER}`, borderRadius: '12px' } as const
const openBtn = { background: ACCENT, color: 'white', border: 'none', borderRadius: '4px', padding: '8px 14px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' } as const
const label11 = { fontSize: '11px', letterSpacing: '0.8px', color: MUTED, fontWeight: 600, marginBottom: '8px' } as const
const emptyCell = { ...tdStyle, textAlign: 'center', color: MUTED, padding: '40px' } as const

function useActor() {
  const { user } = useAuth()
  return user?.name ?? 'Administrator'
}

/* ------------------------------------------------------------------ */
/* Office Management                                                   */
/* ------------------------------------------------------------------ */

interface OfficeForm { officeCode: string; officeName: string; description: string; status: OfficeRow['status'] }

function OfficeManagement({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const home = useHome()
  const db = useDb()
  const actor = useActor()
  const [statusFilter, setStatusFilter] = useState<'All' | OfficeRow['status']>('All')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [form, setForm] = useState<OfficeForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const staffOf = (o: OfficeRow) => db.employees.filter((e) => e.officeId === o.id && e.status !== 'Separated')
  const viewing = db.offices.find((o) => o.id === viewingId) ?? null
  const q = search.trim().toLowerCase()
  const filtered = db.offices.filter((o) => (statusFilter === 'All' || o.status === statusFilter) && (!q || [o.officeCode, o.officeName, o.description].some((v) => v.toLowerCase().includes(q))))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  function openAdd() {
    setForm({ officeCode: '', officeName: '', description: '', status: 'Active' })
    setEditingId(null)
    setError('')
  }
  function openEdit(o: OfficeRow) {
    setForm({ officeCode: o.officeCode, officeName: o.officeName, description: o.description, status: o.status })
    setEditingId(o.id)
    setViewingId(null)
    setError('')
  }
  function saveOffice() {
    if (!form) return
    const code = form.officeCode.trim().toUpperCase()
    const name = form.officeName.trim()
    if (!code || !name) return setError('Office code and name are required.')
    if (db.offices.some((o) => o.officeCode === code && o.id !== editingId)) return setError(`Office code ${code} is already used.`)
    save(
      (d) => {
        if (editingId === null) {
          d.offices.push({ id: nextNumber(d.offices.map((o) => o.id)), officeCode: code, officeName: name, description: form.description.trim(), status: form.status, createdAt: '', updatedAt: '' })
        } else {
          const row = d.offices.find((o) => o.id === editingId)!
          const oldCode = row.officeCode
          Object.assign(row, { officeCode: code, officeName: name, description: form.description.trim(), status: form.status })
          // employees keep their link when the code changes
          d.employees.forEach((e) => { if (e.officeCode === oldCode) e.officeCode = code })
        }
      },
      { event: 'Config Change', details: `${actor}: ${editingId === null ? 'added' : 'updated'} office ${code}` },
    )
    setForm(null)
  }
  function deleteOffice(o: OfficeRow) {
    const people = db.employees.filter((e) => e.officeId === o.id).length
    if (people > 0) {
      window.alert(`${o.officeCode} still has ${people} employee record(s). Reassign them, or set the office to Inactive instead.`)
      return
    }
    if (!window.confirm(`Delete ${o.officeCode} – ${o.officeName}? This cannot be undone.`)) return
    save((d) => { d.offices = d.offices.filter((x) => x.id !== o.id) }, { event: 'Config Change', details: `${actor}: deleted office ${o.officeCode}` })
    setViewingId(null)
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: home }, { label: 'Organisation Data' }, { label: 'Office Management' }]}
        title="Office Management"
        description="Maintain the DOST offices that employees belong to."
        actions={<button style={primaryBtn} onClick={openAdd}><Icon name="plus" /> Add Office</button>}
      />
      <StatRow>
        <StatCard label="TOTAL OFFICES" value={`${db.offices.length} Offices`} icon="building" />
        <StatCard label="ACTIVE OFFICES" value={`${db.offices.filter((o) => o.status === 'Active').length} Active`} icon="check" />
        <StatCard label="EMPLOYEES" value={`${db.employees.filter((e) => e.status !== 'Separated').length} Personnel`} icon="people" accent />
        <StatCard label="AVG. PER OFFICE" value={db.offices.length ? (db.employees.filter((e) => e.status !== 'Separated').length / db.offices.length).toFixed(1) : '0'} icon="gauge" />
      </StatRow>

      <div style={{ ...box, padding: '20px', marginBottom: '22px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search office by code or name..." />
        <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'All' | OfficeRow['status']); setPage(1) }}>
          <option value="All">Status: All</option>
          <option value="Active">Status: Active</option>
          <option value="Inactive">Status: Inactive</option>
        </select>
        <button style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }} onClick={() => { setSearch(''); setStatusFilter('All'); setPage(1) }}><Icon name="filter" /> Reset</button>
      </div>

      <div style={{ ...box, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>OFFICE CODE</th><th style={thStyle}>OFFICE NAME</th><th style={thStyle}>DESCRIPTION</th><th style={thStyle}>EMPLOYEES</th><th style={thStyle}>STATUS</th><th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700, fontSize: '15px' }}>{o.officeCode}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#111827' }}>{o.officeName}</td>
                  <td style={{ ...tdStyle, color: MUTED, maxWidth: '280px' }}>{o.description || '—'}</td>
                  <td style={tdStyle}>{staffOf(o).length}</td>
                  <td style={tdStyle}><StatusPill status={o.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><button style={openBtn} onClick={() => setViewingId(o.id)}>View Detail &rarr;</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={emptyCell}>No offices match your search or filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f7f6f4', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1} to {Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length} Offices</span>
          <Pagination page={currentPage} total={totalPages} onChange={setPage} />
        </div>
      </div>

      {viewing && (
        <Modal
          title={`${viewing.officeCode} · Office Detail`}
          onClose={() => setViewingId(null)}
          footer={<><button style={dangerBtn} onClick={() => deleteOffice(viewing)}>Delete</button><button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={() => openEdit(viewing)}>Edit Office</button></>}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{viewing.officeName}</h3>
          <div style={{ marginBottom: '14px' }}><StatusPill status={viewing.status} /></div>
          <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 16px' }}>{viewing.description || '—'}</p>
          <div style={label11}>EMPLOYEES ({staffOf(viewing).length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {staffOf(viewing).map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', padding: '8px 12px', background: '#f7f6f4', borderRadius: '6px' }}>
                <span><strong>{e.firstName} {e.lastName}</strong></span><span style={{ color: MUTED }}>{e.positionTitle}</span>
              </div>
            ))}
            {staffOf(viewing).length === 0 && <div style={{ color: MUTED, fontSize: '13px' }}>No employees assigned.</div>}
          </div>
        </Modal>
      )}

      {form && (
        <Modal
          title={editingId !== null ? `Edit ${form.officeCode}` : 'Add Office'}
          onClose={() => setForm(null)}
          footer={<><button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button><button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={saveOffice}>{editingId !== null ? 'Save Changes' : 'Add Office'}</button></>}
        >
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Office code *"><input style={inputStyle} value={form.officeCode} placeholder="e.g. PHIVOLCS" onChange={(e) => setForm({ ...form, officeCode: e.target.value })} /></Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OfficeRow['status'] })}><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
            </Field>
            <Field label="Office name *" full><input style={inputStyle} value={form.officeName} onChange={(e) => setForm({ ...form, officeName: e.target.value })} /></Field>
            <Field label="Description" full><textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Competency Management                                               */
/* ------------------------------------------------------------------ */

interface CompetencyForm {
  competencyCode: string
  competencyName: string
  description: string
  categoryId: number
  competencyType: string
  status: CompetencyStatus
  indicators: string[] // one per proficiency level (4)
}

function CompetencyManagement({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const home = useHome()
  const db = useDb()
  const actor = useActor()
  const levels = db.config.proficiencyLevels
  const categories = db.config.categories
  const [tab, setTab] = useState<number | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | CompetencyStatus>('Active')
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [form, setForm] = useState<CompetencyForm | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const catName = (id: number) => categories.find((c) => c.id === id)?.name ?? '—'
  const viewing = db.competencies.find((c) => c.id === viewingId) ?? null
  const indicatorsOf = (c: CompetencyRow) => levels.map((_, i) => db.behavioralIndicators.find((b) => b.competencyId === c.id && b.proficiencyLevelId === i + 1)?.indicatorText ?? '')
  const usedBy = (c: CompetencyRow) => db.positionCompetencies.filter((r) => r.competencyId === c.id).length

  const q = search.trim().toLowerCase()
  const noTab = db.competencies.filter((c) => (statusFilter === 'All' || c.status === statusFilter) && (!q || [c.competencyCode, c.competencyName, c.description].some((v) => v.toLowerCase().includes(q))))
  const filtered = noTab.filter((c) => tab === 'All' || c.categoryId === tab)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  function openAdd() {
    const nums = db.competencies.map((c) => Number(c.competencyCode.replace(/\D/g, '')) || 0)
    setForm({ competencyCode: `C${String(Math.max(0, ...nums) + 1).padStart(2, '0')}`, competencyName: '', description: '', categoryId: categories[0]?.id ?? 1, competencyType: 'Core', status: 'Active', indicators: levels.map(() => '') })
    setEditingId(null)
    setError('')
  }
  function openEdit(c: CompetencyRow) {
    setForm({ competencyCode: c.competencyCode, competencyName: c.competencyName, description: c.description, categoryId: c.categoryId, competencyType: c.competencyType, status: c.status, indicators: indicatorsOf(c) })
    setEditingId(c.id)
    setViewingId(null)
    setError('')
  }
  function saveCompetency() {
    if (!form) return
    const code = form.competencyCode.trim().toUpperCase()
    if (!code || !form.competencyName.trim()) return setError('Code and name are required.')
    if (db.competencies.some((c) => c.competencyCode === code && c.id !== editingId)) return setError(`Code ${code} is already used.`)
    if (editingId !== null && form.status === 'Archived' && usedBy(db.competencies.find((c) => c.id === editingId)!) > 0) return setError('This competency is required by one or more positions. Remove it from those positions before archiving.')
    if (form.indicators.some((t) => !t.trim())) return setError('Enter a behavioural indicator for every proficiency level.')
    save(
      (d) => {
        let id = editingId
        const base = { competencyCode: code, competencyName: form.competencyName.trim(), description: form.description.trim(), categoryId: form.categoryId, competencyType: form.competencyType, status: form.status }
        if (id === null) {
          id = nextNumber(d.competencies.map((c) => c.id))
          d.competencies.push({ id, ...base, createdAt: '', updatedAt: '' })
        } else {
          Object.assign(d.competencies.find((c) => c.id === id)!, base)
        }
        // tbl_behavioral_indicators: one row per proficiency level
        d.behavioralIndicators = d.behavioralIndicators.filter((b) => b.competencyId !== id)
        form.indicators.forEach((text, i) => {
          d.behavioralIndicators.push({ id: nextNumber(d.behavioralIndicators.map((b) => b.id)), competencyId: id!, proficiencyLevelId: i + 1, indicatorText: text.trim(), createdAt: '', updatedAt: '' })
        })
      },
      { event: 'Config Change', details: `${actor}: ${editingId === null ? 'added' : 'updated'} competency ${code}` },
    )
    setForm(null)
  }
  function deleteCompetency(c: CompetencyRow) {
    const n = usedBy(c)
    const people = db.employees.filter((e) => e.competencies.some((x) => x.code === c.competencyCode)).length
    if (n > 0 || people > 0) {
      window.alert(`${c.competencyCode} is used by ${n} position requirement(s) and ${people} employee profile(s). Archive it instead of deleting.`)
      return
    }
    if (!window.confirm(`Delete ${c.competencyCode} – ${c.competencyName}? This cannot be undone.`)) return
    save(
      (d) => {
        d.competencies = d.competencies.filter((x) => x.id !== c.id)
        d.behavioralIndicators = d.behavioralIndicators.filter((b) => b.competencyId !== c.id)
      },
      { event: 'Config Change', details: `${actor}: deleted competency ${c.competencyCode}` },
    )
    setViewingId(null)
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: home }, { label: 'Competency Framework' }, { label: 'Competency Management' }]}
        title="Competency Management"
        description="Maintain the competency library, its categories and the behavioural indicator for each proficiency level."
        actions={<button style={primaryBtn} onClick={openAdd}><Icon name="plus" /> Add Competency</button>}
      />
      <StatRow>
        <StatCard label="COMPETENCIES" value={`${db.competencies.length} Total`} icon="check" />
        <StatCard label="ACTIVE" value={`${db.competencies.filter((c) => c.status === 'Active').length} Active`} icon="check" />
        <StatCard label="CATEGORIES" value={`${categories.length} Categories`} icon="building" accent />
        <StatCard label="PROFICIENCY LEVELS" value={`${levels.length} Levels`} icon="gauge" />
      </StatRow>

      <div style={{ ...box, padding: '20px 20px 16px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', paddingBottom: '18px', borderBottom: `1px solid ${BORDER}` }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search competency by code, name or description..." />
          <select style={selectStyle} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'All' | CompetencyStatus); setPage(1) }}>
            <option value="All">Status: All</option><option value="Active">Status: Active</option><option value="Draft">Status: Draft</option><option value="Archived">Status: Archived</option>
          </select>
          <button style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }} onClick={() => { setSearch(''); setStatusFilter('Active'); setTab('All'); setPage(1) }}><Icon name="filter" /> Reset</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', flexWrap: 'wrap' }}>
          <TabButton active={tab === 'All'} label="All Competencies" count={noTab.length} onClick={() => { setTab('All'); setPage(1) }} />
          {categories.map((c) => (
            <TabButton key={c.id} active={tab === c.id} label={c.name} count={noTab.filter((x) => x.categoryId === c.id).length} onClick={() => { setTab(c.id); setPage(1) }} />
          ))}
        </div>
      </div>

      <div style={{ ...box, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr><th style={thStyle}>CODE</th><th style={thStyle}>COMPETENCY</th><th style={thStyle}>CATEGORY</th><th style={thStyle}>USED BY</th><th style={thStyle}>STATUS</th><th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...tdStyle, color: ACCENT, fontWeight: 700, fontSize: '15px' }}>{c.competencyCode}</td>
                  <td style={{ ...tdStyle, maxWidth: '340px' }}>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{c.competencyName}</div>
                    <div style={{ color: MUTED, fontSize: '13px' }}>{c.description}</div>
                  </td>
                  <td style={tdStyle}><span style={{ background: '#f1f0ee', fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>{catName(c.categoryId)}</span></td>
                  <td style={tdStyle}>{usedBy(c)} position{usedBy(c) === 1 ? '' : 's'}</td>
                  <td style={tdStyle}><StatusPill status={c.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}><button style={openBtn} onClick={() => setViewingId(c.id)}>View Detail &rarr;</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={emptyCell}>No competencies match your search or filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f7f6f4', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1} to {Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length} Competencies</span>
          <Pagination page={currentPage} total={totalPages} onChange={setPage} />
        </div>
      </div>

      {viewing && (
        <Modal
          title={`${viewing.competencyCode} · Competency Detail`}
          onClose={() => setViewingId(null)}
          footer={<><button style={dangerBtn} onClick={() => deleteCompetency(viewing)}>Delete</button><button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={() => openEdit(viewing)}>Edit Competency</button></>}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{viewing.competencyName}</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <span style={{ background: '#f1f0ee', fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>{catName(viewing.categoryId)}</span>
            <StatusPill status={viewing.status} />
          </div>
          <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 16px' }}>{viewing.description || '—'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <DetailRow label="Type" value={viewing.competencyType} />
            <DetailRow label="Required by" value={`${usedBy(viewing)} position(s)`} />
          </div>
          <div style={label11}>BEHAVIOURAL INDICATORS BY LEVEL</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {indicatorsOf(viewing).map((t, i) => (
              <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13.5px' }}>
                <strong style={{ color: ACCENT }}>L{i + 1} {levels[i]?.name}</strong>
                <div style={{ color: '#374151', marginTop: '3px' }}>{t || '—'}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {form && (
        <Modal
          title={editingId !== null ? `Edit ${form.competencyCode}` : 'Add Competency'}
          onClose={() => setForm(null)}
          footer={<><button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button><button style={{ ...primaryBtn, padding: '9px 16px', fontSize: '13px' }} onClick={saveCompetency}>{editingId !== null ? 'Save Changes' : 'Add Competency'}</button></>}
        >
          {error && <div style={errorBox}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Code *"><input style={inputStyle} value={form.competencyCode} onChange={(e) => setForm({ ...form, competencyCode: e.target.value })} /></Field>
            <Field label="Category">
              <select style={inputStyle} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </Field>
            <Field label="Name *" full><input style={inputStyle} value={form.competencyName} onChange={(e) => setForm({ ...form, competencyName: e.target.value })} /></Field>
            <Field label="Description" full><textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Type">
              <select style={inputStyle} value={form.competencyType} onChange={(e) => setForm({ ...form, competencyType: e.target.value })}>
                {[...new Set(['Core', 'Functional', 'Leadership', form.competencyType])].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CompetencyStatus })}><option value="Active">Active</option><option value="Draft">Draft</option><option value="Archived">Archived</option></select>
            </Field>
          </div>
          <div style={{ ...label11, marginTop: '18px' }}>BEHAVIOURAL INDICATORS *</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {levels.map((l, i) => (
              <Field key={l.name} label={`Level ${i + 1} – ${l.name}`}>
                <textarea style={{ ...inputStyle, minHeight: '54px', resize: 'vertical' }} value={form.indicators[i] ?? ''} onChange={(e) => setForm({ ...form, indicators: form.indicators.map((t, k) => (k === i ? e.target.value : t)) })} />
              </Field>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */

export default function OfficeCompetencyManagement() {
  const db = useDb()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  // Administrative Admin does not manage offices, so that tab is hidden and the page always shows competencies
  const canSeeOffices = user?.role !== 'administrative_admin'
  const isOffice = canSeeOffices && searchParams.get('tab') !== 'competencies'
  const [officeSearch, setOfficeSearch] = useState('')
  const [competencySearch, setCompetencySearch] = useState('')

  return (
    <RoleShell>
      {canSeeOffices && (
        <PageTabs
          active={isOffice ? 'offices' : 'competencies'}
          onChange={(key) => setSearchParams({ tab: key })}
          tabs={[
            { key: 'offices', label: 'Office Management', count: db.offices.length },
            { key: 'competencies', label: 'Competency Management', count: db.competencies.length },
          ]}
        />
      )}
      {isOffice ? <OfficeManagement search={officeSearch} setSearch={setOfficeSearch} /> : <CompetencyManagement search={competencySearch} setSearch={setCompetencySearch} />}
    </RoleShell>
  )
}
