// Concerned Office › Competency Information › Position Requirements ("View Position Requirements")
// The competencies and required levels for each position (tbl_position_competencies),
// and how the office's staff in that position measure up.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDb, employeeName, positions } from '../technical/techData'
import { PageHeader, Card, Toggle, Avatar, EmptyRow, SearchBox } from '../technical/techUi'
import { thStyle, tdStyle, infoBox, linkBtn, MUTED, BORDER, NAVY, SIDEBAR_ACTIVE } from '../technical/techTheme'
import { officeEmployees, gapRows, matchScore, requirementsFor, competencyByCode, gapStatusOf } from './officeData'
import { OfficeLayout, CategoryTag, PriorityTag, LevelBlocks, MatchRing, GapPill } from './officeUi'

export default function PositionRequirementsPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')

  const staff = officeEmployees(db.employees)
  const officeTitles = new Set(staff.map((e) => e.positionTitle))
  const list = positions
    .filter((p) => showAll || officeTitles.has(p.title))
    .filter((p) => !search.trim() || p.title.toLowerCase().includes(search.trim().toLowerCase()))
  const selectedTitle = params.get('position') ?? list[0]?.title ?? ''
  const selected = positions.find((p) => p.title === selectedTitle)
  const reqs = requirementsFor(selectedTitle)
  const incumbents = staff.filter((e) => e.positionTitle === selectedTitle)

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'Competency Information' }, { label: 'Position Requirements' }, ...(selected ? [{ label: selected.title }] : [])]}
        title="Position Requirements"
        description="Competencies and minimum proficiency levels each position needs, and how your staff in that position compare."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* Position list */}
        <Card title="Positions" subtitle={showAll ? `${list.length} DOST positions` : `${list.length} positions in your office`} flush>
          <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <SearchBox value={search} onChange={setSearch} placeholder="Find a position..." />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
              <Toggle checked={showAll} onChange={setShowAll} label="Show all DOST positions" /> Show all DOST positions
            </label>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}` }}>
            {list.length === 0 && <div style={{ padding: '20px', color: MUTED, fontSize: '13px' }}>No positions found.</div>}
            {list.map((p) => {
              const on = p.title === selectedTitle
              const count = staff.filter((e) => e.positionTitle === p.title).length
              return (
                <button
                  key={p.title}
                  onClick={() => setParams({ position: p.title })}
                  style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: '8px', alignItems: 'center', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid #eceef2', background: on ? '#eef4fa' : 'white', borderLeft: `4px solid ${on ? SIDEBAR_ACTIVE : 'transparent'}`, cursor: 'pointer' }}
                >
                  <span>
                    <span style={{ display: 'block', fontWeight: on ? 700 : 600, color: '#111827', fontSize: '13.5px' }}>{p.title}</span>
                    <span style={{ fontSize: '12px', color: MUTED }}>SG {p.salaryGrade} · {requirementsFor(p.title).length} competencies</span>
                  </span>
                  <span style={{ fontSize: '12px', color: count ? NAVY : MUTED, fontWeight: 700, whiteSpace: 'nowrap' }}>{count} staff</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Selected position */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card
              title={selected.title}
              subtitle={`Salary Grade ${selected.salaryGrade} · ${reqs.length} required competencies · ${incumbents.length} of your staff in this position`}
              flush
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>CODE</th>
                      <th style={thStyle}>COMPETENCY</th>
                      <th style={thStyle}>CATEGORY</th>
                      <th style={thStyle}>PRIORITY</th>
                      <th style={thStyle}>REQUIRED LEVEL</th>
                      <th style={thStyle}>STAFF MEETING IT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqs.length === 0 && <EmptyRow colSpan={6} text="No requirements mapped for this position yet." />}
                    {reqs.map((r) => {
                      const c = competencyByCode(r.code)!
                      const meeting = incumbents.filter((e) => (e.competencies.find((x) => x.code === r.code)?.level ?? 0) >= r.level).length
                      return (
                        <tr key={r.code}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: NAVY }}>{r.code}</td>
                          <td style={tdStyle}>
                            <Link to={`/office/competencies?open=${r.code}`} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}>{c.title}</Link>
                            <div style={{ fontSize: '12.5px', color: MUTED, maxWidth: '320px' }}>Level {r.level}: {c.indicators[r.level - 1]}</div>
                          </td>
                          <td style={tdStyle}><CategoryTag category={c.category} /></td>
                          <td style={tdStyle}><PriorityTag priority={r.priority} /></td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <LevelBlocks current={r.level} />
                              <span style={{ fontSize: '13px' }}>L{r.level} {db.config.proficiencyLevels[r.level - 1]?.name}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            {incumbents.length ? (
                              <div style={{ minWidth: '110px' }}>
                                <div style={{ fontSize: '13px', marginBottom: '4px' }}>{meeting} of {incumbents.length}</div>
                                <div style={{ height: 6, background: '#eef0f3', borderRadius: '999px' }}>
                                  <div style={{ width: `${(meeting / incumbents.length) * 100}%`, height: '100%', background: meeting === incumbents.length ? '#0ca30c' : '#fab219', borderRadius: '999px' }} />
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: MUTED }}>-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Your Staff in This Position" subtitle="Current levels compared with the requirements above">
              {incumbents.length === 0 && <p style={{ color: MUTED, fontSize: '13.5px', margin: 0 }}>Nobody in your office holds this position.</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {incumbents.map((e) => {
                  const rows = gapRows(e)
                  return (
                    <div key={e.id} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <Avatar name={employeeName(e)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link to={`/office/employees/${e.id}`} style={{ fontWeight: 700, color: '#0f2442', textDecoration: 'none' }}>{employeeName(e, true)}</Link>
                          <div style={{ fontSize: '12px', color: MUTED }}>{e.employeeNo}</div>
                        </div>
                        <MatchRing value={matchScore(rows)} size={48} />
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {rows.filter((r) => r.status !== 'Meets').slice(0, 3).map((r) => (
                          <span key={r.code} title={`${r.title}: ${gapStatusOf(r.required, r.current)}`}><GapPill status={r.status} /> <span style={{ fontSize: '12px', color: MUTED }}>{r.code}</span></span>
                        ))}
                        {rows.every((r) => r.status === 'Meets') && <GapPill status="Meets" />}
                      </div>
                      <Link to={`/office/competency-profiles?employee=${e.id}`} style={{ ...linkBtn, display: 'inline-block', marginTop: '10px' }}>View competency profile ›</Link>
                    </div>
                  )
                })}
              </div>
            </Card>

            <div style={infoBox}>
              Position requirements are set by the Administrative Admin (Position-Competency Mapping). Ask them if a requirement looks wrong for your office.
            </div>
          </div>
        ) : (
          <Card><p style={{ margin: 0, color: MUTED }}>Select a position.</p></Card>
        )}
      </div>
    </OfficeLayout>
  )
}
