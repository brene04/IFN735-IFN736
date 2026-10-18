// Administrative Admin / Executive › Employee Competency Profiles › one employee
// Required vs current competency levels with radar chart, development focus and gap table.
// Same data and components as the Concerned Office competency profile.
import { Link, useNavigate, useParams } from 'react-router-dom'
import RoleShell from '../../components/RoleShell'
import { useDb, employeeName, officeName } from '../technical/techData'
import { PageHeader, Card, Avatar, Pill, DetailRow, Icon } from '../technical/techUi'
import { ghostBtn, primaryBtn, thStyle, tdStyle, MUTED, BORDER, NAVY, formatDate, downloadCsv } from '../technical/techTheme'
import { gapRows, matchScore } from '../office/officeData'
import type { GapRow, Priority } from '../office/officeData'
import { RadarChart, MatchRing, GapPill, PriorityTag, LevelBlocks } from '../office/officeUi'

const priorityRank: Record<Priority, number> = { Critical: 0, Important: 1, Desirable: 2 }

function suggestion(r: GapRow) {
  if (r.status === 'Not Assessed') return 'Schedule a competency assessment to record a current level.'
  if (r.status === 'Major Gap') return `Formal training plus a coached work assignment to move from L${r.current} to L${r.required}.`
  return `On-the-job coaching or a short course to reach L${r.required}.`
}

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const db = useDb()
  const e = db.employees.find((x) => String(x.id) === id)

  if (!e) {
    return (
      <RoleShell>
        <PageHeader crumbs={[{ label: 'Dashboard' }, { label: 'Employee Competency Profiles', to: '/employees' }, { label: 'Not found' }]} title="Employee not found" description="This employee does not exist or was removed." />
        <Card><Link to="/employees" style={{ color: NAVY, fontWeight: 600 }}>&larr; Back to Employee Competency Profiles</Link></Card>
      </RoleShell>
    )
  }

  const rows = gapRows(e)
  const score = matchScore(rows)
  const focus = rows.filter((r) => r.status !== 'Meets').sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.gap - a.gap)
  const count = (s: GapRow['status']) => rows.filter((r) => r.status === s).length

  function exportCsv() {
    downloadCsv(`competency_profile_${e!.employeeNo}.csv`, [
      ['Employee', employeeName(e, true)], ['Position', e!.positionTitle], ['Match score', `${score}%`], [],
      ['Code', 'Competency', 'Category', 'Priority', 'Required', 'Current', 'Gap', 'Status'],
      ...rows.map((r) => [r.code, r.title, r.category, r.priority, r.required, r.current || 'Not assessed', r.gap, r.status]),
    ])
  }

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard' }, { label: 'Competency Framework' }, { label: 'Employee Competency Profiles', to: '/employees' }, { label: employeeName(e) }]}
        title="Employee Competency Profile"
        description="Compare the employee's current proficiency with what their position requires."
        actions={
          <>
            <button style={ghostBtn} onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
            <button style={ghostBtn} onClick={() => window.print()}>Print</button>
            <button style={primaryBtn} onClick={() => navigate('/gap-analysis')}>Run Gap Analysis</button>
          </>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <Avatar name={employeeName(e)} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '19px', fontWeight: 800, color: NAVY }}>{employeeName(e, true)}</div>
              <div style={{ color: MUTED, fontSize: '13.5px', margin: '2px 0 8px' }}>{e.positionTitle} · SG {e.salaryGrade} · {e.employeeNo}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Pill text={e.competencyProfile} dot={false} />
                <Pill text={`Assessment: ${e.assessmentStatus}`} tone="neutral" />
                <Pill text={e.status} />
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

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
          <Card title="Employee Details">
            <DetailRow label="Office" value={`${e.officeCode} · ${officeName(e.officeCode)}`} />
            <DetailRow label="Position" value={`${e.positionTitle} (SG ${e.salaryGrade})`} />
            <DetailRow label="Employment type" value={e.employmentType} />
            <DetailRow label="Date hired" value={formatDate(e.dateHired)} />
            <DetailRow label="GovMail" value={e.email} />
          </Card>
          <Card title="Competency Gap Table" subtitle={`${rows.length} competencies required for this position`} flush>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>COMPETENCY</th>
                    <th style={thStyle}>REQ.</th>
                    <th style={thStyle}>CURRENT</th>
                    <th style={thStyle}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code}>
                      <td style={{ ...tdStyle, minWidth: '150px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: MUTED }}>{r.code} · {r.category}</div>
                      </td>
                      <td style={tdStyle}>L{r.required}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <LevelBlocks current={r.current} required={r.required} />
                          <span style={{ fontSize: '13px' }}>{r.current ? `L${r.current}` : '-'}</span>
                        </div>
                      </td>
                      <td style={tdStyle}><GapPill status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </RoleShell>
  )
}
