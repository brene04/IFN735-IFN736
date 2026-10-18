// POSITIONS  (/technical/positions)
// Position Management in DOST / CSC plantilla format (tbl_positions):
// position code, plantilla item no., title, salary grade, level, division, employment type,
// qualification standards and status. New positions appear straight away in the
// Add Employee form (see syncPositionList in techData).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDb, save, nextNumber, levelFor, defaultQualifications, employeeName, CURRENT_ACTOR } from './techData'
import type { PositionRow, PositionQualifications } from './techData'
import { TechLayout, PageHeader, StatRow, StatCard, Card, Pill, Modal, Field, DetailRow, SearchBox, TableFooter, EmptyRow, Notice, Icon } from './techUi'
import { inputStyle, selectStyle, primaryBtn, smallPrimaryBtn, ghostBtn, rowBtn, rowGhostBtn, thStyle, tdStyle, errorBox, infoBox, MUTED, NAVY, BORDER, paginate, downloadCsv, todayIso, formatDate } from './techTheme'

const PER_PAGE = 8

// This page works with plantilla-style names; the shared database stores tbl_positions columns
// (position_code, title ...), so rows are converted on the way in and out.
interface Position {
  id: number
  code: string
  itemNo: string
  title: string
  salaryGrade: number
  level: string
  department: string
  employmentType: 'Permanent' | 'Contract of Service'
  description: string
  qualifications: PositionQualifications
  status: 'Active' | 'Inactive'
  createdAt: string
  updatedAt: string
}

const toPosition = (r: PositionRow): Position => ({
  id: r.id, code: r.positionCode, itemNo: r.itemNo ?? '', title: r.positionTitle, salaryGrade: r.salaryGrade, level: r.level ?? levelFor(r.salaryGrade),
  department: r.department, employmentType: r.employmentType === 'Plantilla' ? 'Permanent' : 'Contract of Service', description: r.description,
  qualifications: r.qualifications ?? defaultQualifications(r.salaryGrade), status: r.status, createdAt: r.createdAt, updatedAt: r.updatedAt,
})

const toRow = (p: Position): PositionRow => ({
  id: p.id, positionCode: p.code, positionTitle: p.title, description: p.description, department: p.department,
  employmentType: p.employmentType === 'Permanent' ? 'Plantilla' : 'Contract of Service', status: p.status, salaryGrade: p.salaryGrade,
  itemNo: p.itemNo, level: p.level, qualifications: p.qualifications, createdAt: p.createdAt, updatedAt: p.updatedAt,
})
const DIVISIONS = ['Office of the Director', 'Research and Development Division', 'ICT Division', 'Finance and Administrative Division', 'Technical Services Division', 'Planning and Evaluation Unit']

export default function PositionsPage() {
  const db = useDb()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('All')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('Active')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Position | 'new' | null>(null) // null = closed, 'new' = Add Position
  const [viewing, setViewing] = useState<Position | null>(null)
  const [notice, setNotice] = useState('')

  // How many current employees hold each position title
  const holders = (title: string) => db.employees.filter((e) => e.positionTitle === title && e.status !== 'Separated')

  const q = search.trim().toLowerCase()
  const rows = db.positions
    .map(toPosition)
    .filter((p) => !q || `${p.code} ${p.itemNo} ${p.title} ${p.department}`.toLowerCase().includes(q))
    .filter((p) => (level === 'All' || p.level === level) && (type === 'All' || p.employmentType === type) && (status === 'All' || p.status === status))
    .sort((a, b) => b.salaryGrade - a.salaryGrade || a.title.localeCompare(b.title))
  const pg = paginate(rows, page, PER_PAGE)

  const active = db.positions.map(toPosition).filter((p) => p.status === 'Active')
  const vacant = active.filter((p) => holders(p.title).length === 0).length

  function exportCsv() {
    downloadCsv('dost_positions.csv', [
      ['Position Code', 'Plantilla Item No.', 'Position Title', 'Salary Grade', 'Level', 'Division / Unit', 'Employment Type', 'Education', 'Experience', 'Training', 'Eligibility', 'Status', 'Incumbents'],
      ...rows.map((p) => [p.code, p.itemNo, p.title, p.salaryGrade, p.level, p.department, p.employmentType, p.qualifications.education, p.qualifications.experience, p.qualifications.training, p.qualifications.eligibility, p.status, holders(p.title).length]),
    ])
  }

  return (
    <TechLayout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/technical/dashboard' }, { label: 'Employee Profile Management' }, { label: 'Positions' }]}
        title="Position Management"
        description="Create and maintain DOST plantilla and Contract of Service positions with salary grade and CSC qualification standards. Active positions are available when adding employees."
        actions={
          <>
            <button style={ghostBtn} onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
            <button style={primaryBtn} onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Add Position</button>
          </>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="ACTIVE POSITIONS" value={active.length} unit="Positions" icon="id" />
        <StatCard label="PLANTILLA (PERMANENT)" value={active.filter((p) => p.employmentType === 'Permanent').length} tone="accent" sub={`${active.filter((p) => p.employmentType !== 'Permanent').length} Contract of Service`} icon="shield" />
        <StatCard label="WITH INCUMBENTS" value={active.length - vacant} tone="success" sub="At least one employee assigned" icon="users" />
        <StatCard label="NO INCUMBENT YET" value={vacant} tone="warning" sub="Ready to assign in Add Employee" icon="hourglass" />
      </StatRow>

      {/* Filters */}
      <Card style={{ marginBottom: '18px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by title, position code, item no. or division..." />
          <select style={selectStyle} value={level} onChange={(e) => { setLevel(e.target.value); setPage(1) }} aria-label="Level">
            <option value="All">All Levels</option>
            <option>First Level</option>
            <option>Second Level</option>
            <option>Third Level</option>
          </select>
          <select style={selectStyle} value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} aria-label="Employment type">
            <option value="All">All Types</option>
            <option value="Permanent">Permanent (Plantilla)</option>
            <option>Contract of Service</option>
          </select>
          <select style={selectStyle} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Status">
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
            <option value="All">Status: All</option>
          </select>
        </div>
      </Card>

      {/* Position register */}
      <Card flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>CODE</th>
                <th style={thStyle}>POSITION TITLE / ITEM NO.</th>
                <th style={thStyle}>SALARY GRADE</th>
                <th style={thStyle}>DIVISION / UNIT</th>
                <th style={thStyle}>TYPE</th>
                <th style={thStyle}>INCUMBENTS</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.length === 0 && <EmptyRow colSpan={8} text="No positions match these filters." />}
              {pg.rows.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: NAVY }}>{p.code}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, color: '#0f2442' }}>{p.title}</div>
                    <div style={{ fontSize: '12.5px', color: MUTED }}>{p.itemNo || (p.employmentType === 'Permanent' ? 'No item no. yet' : 'Contract of Service')}</div>
                  </td>
                  <td style={tdStyle}>
                    SG {p.salaryGrade}
                    <div style={{ fontSize: '12px', color: MUTED }}>{p.level}</div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: '13px' }}>{p.department}</td>
                  <td style={tdStyle}><Pill text={p.employmentType === 'Permanent' ? 'Plantilla' : 'COS'} tone={p.employmentType === 'Permanent' ? 'navy' : 'warning'} dot={false} /></td>
                  <td style={tdStyle}>{holders(p.title).length}</td>
                  <td style={tdStyle}><Pill text={p.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button style={{ ...rowGhostBtn, marginRight: '6px' }} onClick={() => setViewing(p)}>View</button>
                    <button style={rowBtn} onClick={() => setEditing(p)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter from={pg.from} to={pg.to} total={rows.length} label="positions" page={pg.current} totalPages={pg.totalPages} onPage={setPage} />
      </Card>

      {editing && (
        <PositionModal
          key={editing === 'new' ? 'new' : editing.id}
          position={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setNotice(msg); setEditing(null) }}
        />
      )}
      {viewing && <ViewModal position={viewing} onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null) }} />}
    </TechLayout>
  )
}

/* ------------------------------------------------------------------ */
/* Add / Edit Position                                                 */
/* ------------------------------------------------------------------ */

function PositionModal({ position, onClose, onSaved }: { position: Position | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const db = useDb()
  const isNew = position === null
  const nextCode = `POS-${String(nextNumber(db.positions.map((p) => p.id))).padStart(3, '0')}`
  const [form, setForm] = useState({
    title: position?.title ?? '',
    itemNo: position?.itemNo ?? '',
    salaryGrade: position?.salaryGrade ?? 11,
    department: position?.department ?? DIVISIONS[1],
    employmentType: position?.employmentType ?? ('Permanent' as Position['employmentType']),
    description: position?.description ?? '',
    status: position?.status ?? ('Active' as Position['status']),
  })
  const [qs, setQs] = useState(position?.qualifications ?? defaultQualifications(11))
  const [error, setError] = useState('')
  const inUse = position ? db.employees.filter((e) => e.positionTitle === position.title && e.status !== 'Separated').length : 0

  // Changing the salary grade on a new position also fills in sample qualification standards
  function setGrade(sg: number) {
    setForm({ ...form, salaryGrade: sg })
    if (isNew) setQs(defaultQualifications(sg))
  }

  function submit() {
    const title = form.title.trim()
    if (title.length < 3) return setError('Position title is required.')
    if (db.positions.some((p) => p.positionTitle.toLowerCase() === title.toLowerCase() && p.id !== position?.id)) return setError(`A position called “${title}” already exists.`)
    if (!Number.isInteger(form.salaryGrade) || form.salaryGrade < 1 || form.salaryGrade > 33) return setError('Salary grade must be a whole number from 1 to 33.')
    if (form.employmentType === 'Permanent' && form.itemNo && !/^[A-Z0-9]+(-[A-Z0-9]+){2,}$/i.test(form.itemNo.trim())) return setError('Plantilla item no. should look like ASTI-SRS2-3-2026.')
    if (position && inUse > 0 && title !== position.title) return setError(`${inUse} employee(s) hold this position. Keep the title, or move them first.`)
    if (position && inUse > 0 && form.status === 'Inactive') return setError(`${inUse} employee(s) still hold this position, so it cannot be made inactive.`)
    if (!qs.education.trim() || !qs.eligibility.trim()) return setError('Education and eligibility are required (CSC qualification standards).')

    const record: Position = {
      id: position?.id ?? nextNumber(db.positions.map((p) => p.id)),
      code: position?.code ?? nextCode,
      itemNo: form.employmentType === 'Permanent' ? form.itemNo.trim().toUpperCase() : '',
      title,
      salaryGrade: form.salaryGrade,
      level: levelFor(form.salaryGrade),
      department: form.department,
      employmentType: form.employmentType,
      description: form.description.trim(),
      qualifications: { education: qs.education.trim(), experience: qs.experience.trim(), training: qs.training.trim(), eligibility: qs.eligibility.trim() },
      status: form.status,
      createdAt: position?.createdAt ?? todayIso(),
      updatedAt: todayIso(),
    }
    save(
      (d) => {
        if (isNew) d.positions.unshift(toRow(record))
        else d.positions = d.positions.map((p) => (p.id === record.id ? toRow(record) : p))
      },
      { event: 'Position Change', details: `${isNew ? 'Position created' : 'Position updated'}: ${record.code} ${record.title} (SG ${record.salaryGrade}) by ${CURRENT_ACTOR.name}` },
    )
    onSaved(isNew ? `Position ${record.code} “${record.title}” created. It is now available in Employees › Add Employee.` : `Position ${record.code} updated.`)
  }

  const qsInput = (key: keyof typeof qs, label: string) => (
    <Field label={label}>
      <input style={inputStyle} value={qs[key]} onChange={(e) => setQs({ ...qs, [key]: e.target.value })} />
    </Field>
  )

  return (
    <Modal
      title={isNew ? 'Add Position' : `Edit Position · ${position.code}`}
      onClose={onClose}
      width={760}
      footer={
        <>
          <button style={ghostBtn} onClick={onClose}>Cancel</button>
          <button style={smallPrimaryBtn} onClick={submit}>{isNew ? 'Save Position' : 'Save Changes'}</button>
        </>
      }
    >
      {error && <div style={errorBox}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
        <h3 style={{ gridColumn: '1 / -1', fontSize: '12px', letterSpacing: '1px', color: MUTED, margin: 0 }}>POSITION DETAILS</h3>
        <Field label="Position code (auto)"><input style={{ ...inputStyle, background: '#f3f4f6' }} value={position?.code ?? nextCode} disabled /></Field>
        <Field label="Position title *">
          <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Science Research Specialist III" />
        </Field>
        <Field label="Salary grade (SG) *" hint={`${levelFor(form.salaryGrade)} position`}>
          <input style={inputStyle} type="number" min={1} max={33} value={form.salaryGrade} onChange={(e) => setGrade(Number(e.target.value))} />
        </Field>
        <Field label="Employment type *">
          <select style={inputStyle} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as Position['employmentType'] })}>
            <option value="Permanent">Permanent (Plantilla)</option>
            <option value="Contract of Service">Contract of Service</option>
          </select>
        </Field>
        <Field label="Plantilla item no." hint={form.employmentType === 'Permanent' ? 'e.g. ASTI-SRS2-3-2026' : 'Not needed for COS'}>
          <input style={{ ...inputStyle, background: form.employmentType === 'Permanent' ? 'white' : '#f3f4f6' }} value={form.employmentType === 'Permanent' ? form.itemNo : ''} disabled={form.employmentType !== 'Permanent'} onChange={(e) => setForm({ ...form, itemNo: e.target.value })} />
        </Field>
        <Field label="Division / unit *">
          <select style={inputStyle} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Description / duties" full>
          <textarea style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Main duties and responsibilities" />
        </Field>

        <h3 style={{ gridColumn: '1 / -1', fontSize: '12px', letterSpacing: '1px', color: MUTED, margin: '6px 0 0' }}>QUALIFICATION STANDARDS (CSC)</h3>
        {qsInput('education', 'Education *')}
        {qsInput('experience', 'Experience')}
        {qsInput('training', 'Training')}
        <div style={{ gridColumn: '1 / -1' }}>{qsInput('eligibility', 'Eligibility *')}</div>

        {!isNew && (
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Position['status'] })}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>
        )}
      </div>
      {isNew && <div style={{ ...infoBox, marginTop: '14px', fontSize: '12.5px' }}>Qualification standards are pre-filled from the salary grade. Edit them to match the approved CSC QS for this position.</div>}
      {!isNew && inUse > 0 && <div style={{ ...infoBox, marginTop: '14px', fontSize: '12.5px' }}>{inUse} employee(s) currently hold this position.</div>}
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* View Position                                                       */
/* ------------------------------------------------------------------ */

function ViewModal({ position: p, onClose, onEdit }: { position: Position; onClose: () => void; onEdit: () => void }) {
  const db = useDb()
  const navigate = useNavigate()
  const people = db.employees.filter((e) => e.positionTitle === p.title && e.status !== 'Separated')
  return (
    <Modal
      title={<>{p.code} · {p.title}</>}
      onClose={onClose}
      width={700}
      footer={
        <>
          <button style={ghostBtn} onClick={onClose}>Close</button>
          <button style={smallPrimaryBtn} onClick={onEdit}>Edit Position</button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px', marginBottom: '18px' }}>
        <DetailRow label="Salary grade" value={`SG ${p.salaryGrade} · ${p.level}`} />
        <DetailRow label="Employment type" value={p.employmentType} />
        <DetailRow label="Plantilla item no." value={p.itemNo || '—'} />
        <DetailRow label="Division / unit" value={p.department} />
        <DetailRow label="Status" value={<Pill text={p.status} />} />
        <DetailRow label="Last updated" value={formatDate(p.updatedAt)} />
        <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Description" value={p.description || '—'} /></div>
      </div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '10px' }}>QUALIFICATION STANDARDS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          <DetailRow label="Education" value={p.qualifications.education} />
          <DetailRow label="Experience" value={p.qualifications.experience || '—'} />
          <DetailRow label="Training" value={p.qualifications.training || '—'} />
          <DetailRow label="Eligibility" value={p.qualifications.eligibility} />
        </div>
      </div>
      <div style={{ fontSize: '12px', letterSpacing: '1px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>INCUMBENTS ({people.length})</div>
      {people.length === 0 && <p style={{ color: MUTED, fontSize: '13.5px', margin: 0 }}>No employee holds this position yet. Add one in Employees › Add Employee.</p>}
      {people.map((e) => (
        <button key={e.id} onClick={() => navigate(`/technical/employees/${e.id}`)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '8px 0', border: 'none', borderBottom: '1px solid #eceef2', background: 'none', cursor: 'pointer', fontSize: '13.5px', textAlign: 'left' }}>
          <strong style={{ color: '#0f2442' }}>{employeeName(e, true)}</strong>
          <span style={{ color: MUTED }}>{e.employeeNo} · {e.officeCode}</span>
        </button>
      ))}
    </Modal>
  )
}
