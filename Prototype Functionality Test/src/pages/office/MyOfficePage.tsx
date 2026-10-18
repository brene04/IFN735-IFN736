// Concerned Office › My Office
// Read-only profile of the signed-in office: details, workforce by position,
// composition and the latest personnel changes (tbl_offices + tbl_employees + tbl_historical_records).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDb, employeeName } from '../technical/techData'
import { PageHeader, Card, StatCard, StatRow, DetailRow, Pill, EmptyRow, ConfirmModal, Notice, Icon } from '../technical/techUi'
import { ghostBtn, linkBtn, thStyle, tdStyle, infoBox, MUTED, NAVY, CHART_BLUE, formatDate } from '../technical/techTheme'
import { useOfficeStore, officeEmployees, gapRows, matchScore, requirementsFor, resetOfficeDemoData, CURRENT_OFFICE } from './officeData'
import { OfficeLayout, StackedBar, MatchRing } from './officeUi'

export default function MyOfficePage() {
  const navigate = useNavigate()
  const db = useDb()
  useOfficeStore() // re-draw after a reset
  const [confirmReset, setConfirmReset] = useState(false)
  const [notice, setNotice] = useState('')

  const all = officeEmployees(db.employees, true)
  const staff = all.filter((e) => e.status !== 'Separated')
  const ids = new Set(all.map((e) => e.id))
  const history = db.history.filter((h) => ids.has(h.employeeId)).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)).slice(0, 8)

  // Group staff by position (most senior first)
  const byPosition = [...new Set(staff.map((e) => e.positionTitle))]
    .map((title) => {
      const people = staff.filter((e) => e.positionTitle === title)
      const assessed = people.filter((e) => e.competencies.length > 0)
      return {
        title,
        salaryGrade: people[0].salaryGrade,
        people,
        requirements: requirementsFor(title).length,
        avgMatch: assessed.length ? Math.round(assessed.reduce((s, e) => s + matchScore(gapRows(e)), 0) / assessed.length) : null,
      }
    })
    .sort((a, b) => b.salaryGrade - a.salaryGrade)

  const count = (f: (e: (typeof staff)[number]) => boolean) => staff.filter(f).length

  return (
    <OfficeLayout>
      <PageHeader
        crumbs={[{ label: 'Concerned Office', to: '/office/dashboard' }, { label: 'My Office' }]}
        title={CURRENT_OFFICE.name}
        description={<><strong>{CURRENT_OFFICE.code}</strong> · {CURRENT_OFFICE.classification} · Office head: {CURRENT_OFFICE.head}, {CURRENT_OFFICE.headTitle}</>}
        actions={
          <button style={ghostBtn} onClick={() => navigate('/office/employees')}>
            <Icon name="users" size={16} /> View Employees
          </button>
        }
      />

      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="TOTAL STAFF" value={staff.length} unit="Personnel" sub={`${count((e) => e.employmentType === 'Permanent')} Plantilla · ${count((e) => e.employmentType !== 'Permanent')} COS`} icon="users" to="/office/employees" />
        <StatCard label="POSITIONS FILLED" value={byPosition.length} unit="Positions" tone="accent" sub="Distinct plantilla / COS positions" icon="id" to="/office/position-requirements" />
        <StatCard label="ON LEAVE" value={count((e) => e.status === 'On Leave')} unit="Staff" tone="warning" sub="Currently on approved leave" icon="clock" to="/office/employees?status=On Leave" />
        <StatCard label="ASSESSMENTS COMPLETED" value={`${staff.length ? Math.round((count((e) => e.assessmentStatus === 'Completed') / staff.length) * 100) : 0}%`} tone="success" sub={`${count((e) => e.assessmentStatus === 'Overdue')} overdue`} icon="check" to="/office/employee-competencies" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: '20px', marginBottom: '20px' }}>
        {/* Office details */}
        <Card title="Office Profile" subtitle="From the office registry (tbl_offices)">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            <DetailRow label="Office code" value={<strong style={{ color: NAVY }}>{CURRENT_OFFICE.code}</strong>} />
            <DetailRow label="Classification" value={<Pill text={CURRENT_OFFICE.classification} tone="navy" dot={false} />} />
            <DetailRow label="Office head" value={`${CURRENT_OFFICE.head}`} />
            <DetailRow label="HR focal person" value={CURRENT_OFFICE.focalPerson} />
            <DetailRow label="Email" value={CURRENT_OFFICE.email} />
            <DetailRow label="Phone" value={CURRENT_OFFICE.phone} />
            <DetailRow label="Established" value={CURRENT_OFFICE.established} />
            <DetailRow label="Status" value={<Pill text="Active" />} />
            <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Address" value={CURRENT_OFFICE.address} /></div>
            <div style={{ gridColumn: '1 / -1' }}><DetailRow label="Mandate" value={CURRENT_OFFICE.mandate} /></div>
          </div>
          <div style={{ ...infoBox, marginTop: '18px', fontSize: '12.5px' }}>
            Office details are maintained by the Administrative Admin. Staff changes go through <Link to="/office/requests" style={{ color: '#0b3d5c', fontWeight: 700 }}>Requests</Link> to the Technical Admin.
          </div>
        </Card>

        {/* Staff grouped by position */}
        <Card title="Workforce by Position" subtitle="Average match = current competency levels vs the position's requirements" flush>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>POSITION</th>
                  <th style={thStyle}>SG</th>
                  <th style={thStyle}>STAFF</th>
                  <th style={thStyle}>REQUIRED COMPETENCIES</th>
                  <th style={thStyle}>AVG. MATCH</th>
                </tr>
              </thead>
              <tbody>
                {byPosition.length === 0 && <EmptyRow colSpan={5} text="No staff recorded for this office." />}
                {byPosition.map((p) => (
                  <tr key={p.title}>
                    <td style={tdStyle}>
                      <Link to={`/office/position-requirements?position=${encodeURIComponent(p.title)}`} style={{ color: '#111827', fontWeight: 600, textDecoration: 'none' }}>{p.title}</Link>
                      <div style={{ fontSize: '12px', color: MUTED }}>{p.people.map((e) => employeeName(e)).join(', ')}</div>
                    </td>
                    <td style={tdStyle}>{p.salaryGrade}</td>
                    <td style={tdStyle}>{p.people.length}</td>
                    <td style={tdStyle}>{p.requirements}</td>
                    <td style={tdStyle}>{p.avgMatch === null ? <span style={{ color: MUTED }}>Not assessed</span> : <MatchRing value={p.avgMatch} size={44} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)', gap: '20px' }}>
        <Card title="Workforce Composition">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.8px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>EMPLOYMENT TYPE</div>
              <StackedBar segments={[{ label: 'Permanent', value: count((e) => e.employmentType === 'Permanent'), color: CHART_BLUE }, { label: 'Contract of Service', value: count((e) => e.employmentType !== 'Permanent'), color: '#fab219' }]} />
            </div>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.8px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>COMPETENCY PROFILE</div>
              <StackedBar segments={[{ label: 'Fully profiled', value: count((e) => e.competencyProfile === 'Fully Profiled'), color: '#0ca30c' }, { label: 'Partially', value: count((e) => e.competencyProfile === 'Partially Profiled'), color: '#fab219' }, { label: 'Not profiled', value: count((e) => e.competencyProfile === 'Not Profiled'), color: '#9ca3af' }]} />
            </div>
            <div>
              <div style={{ fontSize: '12px', letterSpacing: '0.8px', color: MUTED, fontWeight: 700, marginBottom: '8px' }}>SEX</div>
              <StackedBar segments={[{ label: 'Female', value: count((e) => e.sex === 'Female'), color: '#1baf7a' }, { label: 'Male', value: count((e) => e.sex === 'Male'), color: CHART_BLUE }]} />
            </div>
          </div>
        </Card>

        <Card title="Recent Personnel Changes" subtitle="Latest entries in the historical records for your staff" flush>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={thStyle}>DATE</th>
                <th style={thStyle}>EMPLOYEE</th>
                <th style={thStyle}>CHANGE</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && <EmptyRow colSpan={3} text="No history yet." />}
              {history.map((h) => {
                const e = db.employees.find((x) => x.id === h.employeeId)
                return (
                  <tr key={h.id}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDate(h.effectiveDate)}</td>
                    <td style={tdStyle}>
                      <Link to={`/office/employees/${h.employeeId}?tab=history`} style={{ color: '#111827', fontWeight: 600, textDecoration: 'none' }}>{employeeName(e)}</Link>
                    </td>
                    <td style={tdStyle}>
                      <Pill text={h.recordType} tone="navy" dot={false} /> <span style={{ marginLeft: '6px' }}>{h.description}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Prototype helper: puts the request and report sample data back */}
      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <button style={{ ...linkBtn, color: MUTED, fontWeight: 500 }} onClick={() => setConfirmReset(true)}>Reset office sample requests &amp; reports</button>
      </div>
      {confirmReset && (
        <ConfirmModal
          title="Reset office sample data?"
          message="All requests and report requests made from this office will be replaced with the original sample data. Employee records are not changed."
          confirmLabel="Reset"
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetOfficeDemoData()
            setConfirmReset(false)
            setNotice('Office requests and reports were reset to the sample data.')
          }}
        />
      )}
    </OfficeLayout>
  )
}
