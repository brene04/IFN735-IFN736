// Concerned Office › Competency Information › Competencies ("View Competencies")
// Read-only competency directory (tbl_competencies + tbl_behavioral_indicators),
// with how each competency applies to the office's positions and staff.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, Tabs, SearchBox, Pill, Modal, TableFooter, EmptyRow, Icon } from '../technical/techUi'
import { selectStyle, thStyle, tdStyle, rowBtn, rowGhostBtn, ghostBtn, MUTED, BORDER, NAVY, ACCENT, paginate } from '../technical/techTheme'
import { officeEmployees, gapStatusOf, requirementsFor, COMPETENCIES, competencyByCode, POSITION_REQUIREMENTS } from './officeData'
import type { Category, Competency } from './officeData'
import { OfficeLayout, CategoryTag, GapPill, PriorityTag, LevelBlocks } from './officeUi'

type CategoryTab = 'All' | Category
const PER_PAGE = 8

export default function OfficeCompetenciesPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState<CategoryTab>('All')
  const [search, setSearch] = useState('')
  const [relevance, setRelevance] = useState('All')
  const [page, setPage] = useState(1)
  const open = competencyByCode(params.get('open') ?? '')

  const staff = officeEmployees(db.employees)
  const officePositions = [...new Set(staff.map((e) => e.positionTitle))]
  const requiredBy = (code: string) => officePositions.filter((p) => requirementsFor(p).some((r) => r.code === code))
  const heldBy = (code: string) => staff.filter((e) => e.competencies.some((c) => c.code === code))

  const q = search.trim().toLowerCase()
  const rows = COMPETENCIES.filter((c) => {
    if (category !== 'All' && c.category !== category) return false
    if (q && !`${c.code} ${c.title} ${c.description}`.toLowerCase().includes(q)) return false
    if (relevance === 'Required' && requiredBy(c.code).length === 0) return false
    return true
  })
  const pg = paginate(rows, page, PER_PAGE)

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Competency Information' }, { label: 'Competencies' }]}
        title="Competency Directory"
        description="DOST master competency framework, behavioural indicators and the 4-tier proficiency standard, with how each competency applies to your office."
        actions={
          <Link to="/office/position-requirements" style={{ ...ghostBtn, textDecoration: 'none' }}>
            <Icon name="id" size={16} /> Position Requirements
          </Link>
        }
      />

      {/* Filters (same layout as the Competency Management mockup) */}
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f7f6f4', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px' }}>
            <Tabs
              tabs={(['All', 'Core', 'Functional', 'Leadership'] as CategoryTab[]).map((c) => ({ value: c, label: c, count: c === 'All' ? COMPETENCIES.length : COMPETENCIES.filter((x) => x.category === c).length }))}
              active={category}
              onChange={(c) => { setCategory(c); setPage(1) }}
            />
          </div>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search competency by name, code, or keyword..." />
          <select style={selectStyle} value={relevance} onChange={(e) => { setRelevance(e.target.value); setPage(1) }} aria-label="Relevance">
            <option value="All">Show: All competencies</option>
            <option value="Required">Required in my office</option>
          </select>
        </div>
      </Card>

      <Card
        flush
        title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><Icon name="log" /> Competency Directory Register <span style={{ color: MUTED, fontSize: '13px' }}>(Master Registry v2026.1)</span></span>}
        right={<span style={{ color: MUTED, fontSize: '13px' }}>{rows.length} Total Competencies</span>}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={thStyle}>CODE</th>
                <th style={thStyle}>COMPETENCY TITLE</th>
                <th style={thStyle}>CATEGORY</th>
                <th style={thStyle}>TIERS</th>
                <th style={thStyle}>REQUIRED BY (YOUR POSITIONS)</th>
                <th style={thStyle}>STAFF ASSESSED</th>
                <th style={thStyle}>STATUS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.length === 0 && <EmptyRow colSpan={8} text="No competencies match these filters." />}
              {pg.rows.map((c) => {
                const selected = open?.code === c.code
                return (
                  <tr key={c.code} style={{ background: selected ? '#eef7fc' : undefined, boxShadow: selected ? `inset 4px 0 0 ${ACCENT}` : undefined }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: selected ? ACCENT : '#111827' }}>{c.code}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: '#0f2442' }}>{c.title}</div>
                      <div style={{ fontSize: '13px', color: MUTED, maxWidth: '360px' }}>{c.description}</div>
                    </td>
                    <td style={tdStyle}><CategoryTag category={c.category} /></td>
                    <td style={{ ...tdStyle, color: '#4b5563' }}>4 Levels</td>
                    <td style={tdStyle}>{requiredBy(c.code).length ? `${requiredBy(c.code).length} position${requiredBy(c.code).length === 1 ? '' : 's'}` : <span style={{ color: MUTED }}>-</span>}</td>
                    <td style={tdStyle}>{heldBy(c.code).length} of {staff.length}</td>
                    <td style={tdStyle}><Pill text="Active" /></td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button style={selected ? rowBtn : rowGhostBtn} onClick={() => setParams({ open: c.code })}>View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <TableFooter from={pg.from} to={pg.to} total={rows.length} label="competencies" page={pg.current} totalPages={pg.totalPages} onPage={setPage} />
      </Card>

      {open && <CompetencyModal competency={open} onClose={() => setParams({})} />}
    </OfficeLayout>
  )
}

// Details: level descriptors, positions that need it, and office staff who hold it
function CompetencyModal({ competency: c, onClose }: { competency: Competency; onClose: () => void }) {
  const db = useDb()
  const staff = officeEmployees(db.employees)
  const officePositions = [...new Set(staff.map((e) => e.positionTitle))]
  const positionsNeeding = Object.entries(POSITION_REQUIREMENTS)
    .filter(([title, reqs]) => officePositions.includes(title) && reqs.some((r) => r.code === c.code))
    .map(([title, reqs]) => ({ title, req: reqs.find((r) => r.code === c.code)! }))
  const people = staff
    .map((e) => ({ e, current: e.competencies.find((x) => x.code === c.code)?.level ?? 0, required: requirementsFor(e.positionTitle).find((r) => r.code === c.code)?.level ?? 0 }))
    .filter((p) => p.current > 0 || p.required > 0)
    .sort((a, b) => b.current - a.current)

  return (
    <Modal title={<>{c.code} · {c.title}</>} onClose={onClose} width={760} footer={<button style={ghostBtn} onClick={onClose}>Close</button>}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <CategoryTag category={c.category} />
        <Pill text="Active" />
      </div>
      <p style={{ margin: '0 0 18px', color: '#374151', fontSize: '14px' }}>{c.description}</p>

      <h3 style={{ fontSize: '14px', color: NAVY, margin: '0 0 8px' }}>Proficiency levels &amp; behavioural indicators</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', marginBottom: '20px' }}>
        <tbody>
          {c.indicators.map((text, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle, width: '170px', padding: '10px 12px' }}>
                <strong>Level {i + 1}</strong> <span style={{ color: MUTED }}>{db.config.proficiencyLevels[i]?.name}</span>
              </td>
              <td style={{ ...tdStyle, padding: '10px 12px' }}>{text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: NAVY, margin: '0 0 8px' }}>Required by your positions ({positionsNeeding.length})</h3>
          {positionsNeeding.length === 0 && <p style={{ color: MUTED, fontSize: '13px' }}>None of your office's positions require this competency.</p>}
          {positionsNeeding.map((p) => (
            <Link key={p.title} to={`/office/position-requirements?position=${encodeURIComponent(p.title)}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '8px 0', borderBottom: '1px solid #eceef2', textDecoration: 'none', color: '#111827', fontSize: '13.5px' }}>
              <span>{p.title}</span>
              <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><PriorityTag priority={p.req.priority} /> <strong>L{p.req.level}</strong></span>
            </Link>
          ))}
        </div>
        <div>
          <h3 style={{ fontSize: '14px', color: NAVY, margin: '0 0 8px' }}>Your staff ({people.length})</h3>
          {people.length === 0 && <p style={{ color: MUTED, fontSize: '13px' }}>No staff hold or need this competency.</p>}
          {people.map(({ e, current, required }) => (
            <Link key={e.id} to={`/office/employees/${e.id}?tab=competencies`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid #eceef2', textDecoration: 'none', color: '#111827', fontSize: '13.5px' }}>
              <span>{employeeName(e)}</span>
              <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <LevelBlocks current={current} required={required || undefined} />
                {required ? <GapPill status={gapStatusOf(required, current)} /> : <span style={{ fontSize: '12px', color: MUTED }}>not required</span>}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Modal>
  )
}
