// Concerned Office › My Employees › Employee Competencies ("View Employee Competency Information")
// Matrix of every staff member × competency: current level / required level, coloured by gap.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, StatCard, StatRow, Tabs, SearchBox, Toggle, Icon } from '../technical/techUi'
import { ghostBtn, selectStyle, thStyle, MUTED, BORDER, NAVY, downloadCsv } from '../technical/techTheme'
import { officeEmployees, gapRows, matchScore, requirementsFor, COMPETENCIES, CURRENT_OFFICE } from './officeData'
import type { Category } from './officeData'
import { OfficeLayout, LevelCell, GapLegend, MatchRing } from './officeUi'

type CategoryTab = 'All' | Category

export default function EmployeeCompetenciesPage() {
  const navigate = useNavigate()
  const db = useDb()
  const [category, setCategory] = useState<CategoryTab>('All')
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('All')
  const [gapsOnly, setGapsOnly] = useState(false)

  const staff = officeEmployees(db.employees)
  const columns = COMPETENCIES.filter((c) => category === 'All' || c.category === category)

  // One row per employee: their gap rows + level for every column
  const rows = staff
    .map((e) => ({ e, gaps: gapRows(e) }))
    .filter(({ e, gaps }) => {
      if (search.trim() && !`${employeeName(e, true)} ${e.employeeNo} ${e.positionTitle}`.toLowerCase().includes(search.trim().toLowerCase())) return false
      if (position !== 'All' && e.positionTitle !== position) return false
      if (gapsOnly && !gaps.some((g) => (category === 'All' || g.category === category) && (g.status === 'Minor Gap' || g.status === 'Major Gap'))) return false
      return true
    })
    .sort((a, b) => b.e.salaryGrade - a.e.salaryGrade)

  const allGaps = staff.flatMap((e) => gapRows(e)).filter((g) => category === 'All' || g.category === category)
  const met = allGaps.filter((g) => g.status === 'Meets').length

  function exportCsv() {
    downloadCsv(`${CURRENT_OFFICE.acronym}_competency_matrix.csv`, [
      ['Employee', 'Position', ...columns.map((c) => `${c.code} ${c.title} (current/required)`), 'Position match %'],
      ...rows.map(({ e, gaps }) => [
        employeeName(e, true),
        e.positionTitle,
        ...columns.map((c) => {
          const cur = e.competencies.find((x) => x.code === c.code)?.level ?? 0
          const req = requirementsFor(e.positionTitle).find((r) => r.code === c.code)?.level
          return `${cur || '-'}${req ? `/${req}` : ''}`
        }),
        matchScore(gaps),
      ]),
    ])
  }

  const categoryColor: Record<Category, string> = { Core: NAVY, Functional: '#0b5f8a', Leadership: '#5b3a8e' }

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'My Employees' }, { label: 'Employee Competencies' }]}
        title="Employee Competency Information"
        description="Current proficiency of every staff member against the level their position requires (levels 1-4). Select a row to open the employee."
        actions={
          <button style={ghostBtn} onClick={exportCsv}>
            <Icon name="download" size={16} /> Export Matrix / CSV
          </button>
        }
      />

      <StatRow>
        <StatCard label="REQUIREMENTS MET" value={`${allGaps.length ? Math.round((met / allGaps.length) * 100) : 0}%`} unit={`${met} of ${allGaps.length}`} tone="success" icon="check" />
        <StatCard label="MINOR GAPS" value={allGaps.filter((g) => g.status === 'Minor Gap').length} unit="1 level short" tone="warning" icon="alert" />
        <StatCard label="MAJOR GAPS" value={allGaps.filter((g) => g.status === 'Major Gap').length} unit="2+ levels short" tone="danger" icon="alert" />
        <StatCard label="NOT YET ASSESSED" value={allGaps.filter((g) => g.status === 'Not Assessed').length} unit="Requirements" tone="neutral" icon="hourglass" />
      </StatRow>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f7f6f4', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '4px' }}>
            <Tabs
              tabs={(['All', 'Core', 'Functional', 'Leadership'] as CategoryTab[]).map((c) => ({ value: c, label: c, count: c === 'All' ? COMPETENCIES.length : COMPETENCIES.filter((x) => x.category === c).length }))}
              active={category}
              onChange={setCategory}
            />
          </div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search employee or position..." />
          <select style={selectStyle} value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Position">
            <option value="All">All Positions</option>
            {[...new Set(staff.map((e) => e.positionTitle))].map((p) => <option key={p}>{p}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#374151' }}>
            <Toggle checked={gapsOnly} onChange={setGapsOnly} label="Only staff with gaps" /> Only staff with gaps
          </label>
        </div>
      </Card>

      <Card title="Competency Matrix" subtitle={`${rows.length} employee${rows.length === 1 ? '' : 's'} · cell shows current / required level`} right={<GapLegend />} flush>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, position: 'sticky', left: 0, zIndex: 1, minWidth: '190px' }}>EMPLOYEE</th>
                {columns.map((c) => (
                  <th key={c.code} title={`${c.title} (${c.category})`} style={{ ...thStyle, textAlign: 'center', letterSpacing: 0, padding: '10px 4px', borderTop: `3px solid ${categoryColor[c.category]}` }}>
                    <Link to={`/office/competencies?open=${c.code}`} style={{ color: '#1f2937', textDecoration: 'none' }}>{c.code}</Link>
                    <div style={{ fontSize: '10px', fontWeight: 500, color: MUTED, maxWidth: 72, margin: '2px auto 0', lineHeight: 1.2, overflowWrap: 'anywhere' }}>{c.title}</div>
                  </th>
                ))}
                <th style={{ ...thStyle, textAlign: 'center' }}>MATCH</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} style={{ padding: '36px', textAlign: 'center', color: MUTED }}>No employees match these filters.</td>
                </tr>
              )}
              {rows.map(({ e, gaps }) => {
                const reqs = requirementsFor(e.positionTitle)
                return (
                  <tr key={e.id} onClick={() => navigate(`/office/employees/${e.id}?tab=competencies`)} style={{ cursor: 'pointer' }}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid #eceef2', position: 'sticky', left: 0, background: 'white' }}>
                      <div style={{ fontWeight: 700, color: '#0f2442' }}>{employeeName(e)}</div>
                      <div style={{ fontSize: '12px', color: MUTED }}>{e.positionTitle}</div>
                    </td>
                    {columns.map((c) => (
                      <td key={c.code} style={{ padding: '8px 4px', borderBottom: '1px solid #eceef2', textAlign: 'center' }}>
                        <LevelCell required={reqs.find((r) => r.code === c.code)?.level ?? null} current={e.competencies.find((x) => x.code === c.code)?.level ?? 0} />
                      </td>
                    ))}
                    <td style={{ padding: '6px', borderBottom: '1px solid #eceef2', textAlign: 'center' }}>
                      <MatchRing value={matchScore(gaps)} size={42} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', fontSize: '12.5px', color: MUTED, borderTop: `1px solid ${BORDER}` }}>
          Grey “L#” = competency held but not required for the position · “·” = not required and not held. Levels: 1 Basic · 2 Intermediate · 3 Advanced · 4 Superior.
        </div>
      </Card>
    </OfficeLayout>
  )
}
