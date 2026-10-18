// Concerned Office › Competency Information › Employee Competency Profiles
// ("View Employee Competency Profile") - one employee's current levels against
// their position's requirements: radar chart, gap table and development focus.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, Avatar, SearchBox, Pill, Icon } from '../technical/techUi'
import { ghostBtn, primaryBtn, thStyle, tdStyle, MUTED, BORDER, NAVY, SIDEBAR_ACTIVE, downloadCsv } from '../technical/techTheme'
import { officeEmployees, gapRows, matchScore } from './officeData'
import type { GapRow, Priority } from './officeData'
import { OfficeLayout, RadarChart, MatchRing, GapPill, PriorityTag, LevelBlocks } from './officeUi'

const priorityRank: Record<Priority, number> = { Critical: 0, Important: 1, Desirable: 2 }

// Plain-language next step for a gap row
function suggestion(r: GapRow) {
  if (r.status === 'Not Assessed') return 'Schedule a competency assessment to record a current level.'
  if (r.status === 'Major Gap') return `Formal training plus a coached work assignment to move from L${r.current} to L${r.required}.`
  return `On-the-job coaching or a short course to reach L${r.required}.`
}

export default function CompetencyProfilesPage() {
  const navigate = useNavigate()
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const staff = officeEmployees(db.employees).sort((a, b) => a.lastName.localeCompare(b.lastName))
  const list = staff.filter((e) => !search.trim() || `${employeeName(e, true)} ${e.positionTitle}`.toLowerCase().includes(search.trim().toLowerCase()))
  const selected = staff.find((e) => String(e.id) === params.get('employee')) ?? staff[0]
  const rows = selected ? gapRows(selected) : []
  const score = matchScore(rows)
  const focus = rows.filter((r) => r.status !== 'Meets').sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.gap - a.gap)
  const count = (s: GapRow['status']) => rows.filter((r) => r.status === s).length

  function exportCsv() {
    if (!selected) return
    downloadCsv(`competency_profile_${selected.employeeNo}.csv`, [
      ['Employee', employeeName(selected, true)],
      ['Position', selected.positionTitle],
      ['Match score', `${score}%`],
      [],
      ['Code', 'Competency', 'Category', 'Priority', 'Required', 'Current', 'Gap', 'Status'],
      ...rows.map((r) => [r.code, r.title, r.category, r.priority, r.required, r.current || 'Not assessed', r.gap, r.status]),
    ])
  }

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Competency Information' }, { label: 'Employee Competency Profiles' }, ...(selected ? [{ label: employeeName(selected) }] : [])]}
        title="Employee Competency Profile"
        description="Compare an employee's current proficiency with what their position requires."
        actions={
          selected && (
            <>
              <button style={ghostBtn} onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
              <button style={ghostBtn} onClick={() => window.print()}>Print</button>
              <button style={primaryBtn} onClick={() => navigate(`/office/gap-analysis?employee=${selected.id}`)}>Request Gap Analysis Report</button>
            </>
          )
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '310px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Employee picker */}
        <Card title="Your Staff" subtitle={`${staff.length} employees`} flush>
          <div style={{ padding: '0 16px 12px' }}>
            <SearchBox value={search} onChange={setSearch} placeholder="Find employee..." />
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, maxHeight: '640px', overflowY: 'auto' }}>
            {list.length === 0 && <div style={{ padding: '20px', color: MUTED, fontSize: '13px' }}>No match.</div>}
            {list.map((e) => {
              const on = e.id === selected?.id
              return (
                <button
                  key={e.id}
                  onClick={() => setParams({ employee: String(e.id) })}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '10px', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #eceef2', background: on ? '#eef4fa' : 'white', borderLeft: `4px solid ${on ? SIDEBAR_ACTIVE : 'transparent'}`, cursor: 'pointer' }}
                >
                  <MatchRing value={matchScore(gapRows(e))} size={40} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: on ? 700 : 600, color: '#111827', fontSize: '13.5px' }}>{employeeName(e)}</span>
                    <span style={{ fontSize: '12px', color: MUTED }}>{e.positionTitle}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header: who, match score and a count of each gap status */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Avatar name={employeeName(selected)} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/office/employees/${selected.id}`} style={{ fontSize: '19px', fontWeight: 800, color: NAVY, textDecoration: 'none' }}>{employeeName(selected, true)}</Link>
                  <div style={{ color: MUTED, fontSize: '13.5px', margin: '2px 0 8px' }}>{selected.positionTitle} · SG {selected.salaryGrade} · {selected.employeeNo}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Pill text={selected.competencyProfile} dot={false} />
                    <Pill text={`Assessment: ${selected.assessmentStatus}`} tone="neutral" />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <MatchRing value={score} size={92} />
                  <div style={{ fontSize: '12px', color: MUTED }}>Position match</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${BORDER}`, marginTop: '16px', paddingTop: '14px' }}>
                {[
                  { label: 'Meets requirement', value: count('Meets'), color: '#0a6b0a' },
                  { label: 'Minor gaps', value: count('Minor Gap'), color: '#8a5a00' },
                  { label: 'Major gaps', value: count('Major Gap'), color: '#a12424' },
                  { label: 'Not assessed', value: count('Not Assessed'), color: '#4b5563' },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: MUTED }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '20px' }}>
              <Card title="Required vs. Current" subtitle="Dashed = required level · filled = current level">
                <RadarChart rows={rows} />
              </Card>
              <Card title="Development Focus" subtitle="Gaps ordered by priority, then size">
                {focus.length === 0 && <p style={{ color: '#0a6b0a', fontSize: '14px', margin: 0 }}>All position requirements are met.</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {focus.map((r) => (
                    <div key={r.code} style={{ borderLeft: `3px solid ${r.status === 'Major Gap' ? '#d03b3b' : r.status === 'Minor Gap' ? '#fab219' : '#9ca3af'}`, paddingLeft: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '13.5px' }}>{r.title}</strong>
                        <PriorityTag priority={r.priority} />
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#374151', marginTop: '3px' }}>{suggestion(r)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card title="Competency Gap Table" flush>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>COMPETENCY</th>
                      <th style={thStyle}>PRIORITY</th>
                      <th style={thStyle}>REQUIRED</th>
                      <th style={thStyle}>CURRENT</th>
                      <th style={thStyle}>GAP</th>
                      <th style={thStyle}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.code}>
                        <td style={{ ...tdStyle, minWidth: '170px' }}>
                          <Link to={`/office/competencies?open=${r.code}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}>{r.code} · {r.title}</Link>
                          <div style={{ fontSize: '12px', color: MUTED }}>{r.category}</div>
                        </td>
                        <td style={tdStyle}><PriorityTag priority={r.priority} /></td>
                        <td style={tdStyle}>L{r.required}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <LevelBlocks current={r.current} required={r.required} />
                            <span style={{ fontSize: '13px' }}>{r.current ? `L${r.current}` : '-'}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: r.gap ? '#a12424' : '#0a6b0a' }}>{r.current ? (r.gap ? `-${r.gap}` : '0') : '-'}</td>
                        <td style={tdStyle}><GapPill status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <Card><p style={{ margin: 0, color: MUTED }}>No staff in your office yet.</p></Card>
        )}
      </div>
    </OfficeLayout>
  )
}
