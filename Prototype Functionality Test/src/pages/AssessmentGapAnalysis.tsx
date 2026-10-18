import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

const assessments = [
  { name: 'Zacki Santos', id: '0001246', gap: 80, level: 'High priority' },
  { name: 'Maria Cruz', id: '0001247', gap: 35, level: 'On track' },
  { name: 'John Reyes', id: '0001248', gap: 60, level: 'Moderate' },
]

function gapBadge(level: string) {
  if (level === 'High priority') return 'badge-danger'
  if (level === 'Moderate') return 'badge-warning'
  return 'badge-success'
}

export default function AssessmentGapAnalysis() {
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assessment & Gap Analysis</h1>
          <p className="page-subtitle">
            Review submitted assessments and automatically calculated competency gaps.
          </p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Assessments Due</div>
          <div className="stat-value">174</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">1,028</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Gap</div>
          <div className="stat-value">18%</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Gap Severity</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td style={{ width: '200px' }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${a.gap}%` }} />
                  </div>
                </td>
                <td>
                  <span className={`badge ${gapBadge(a.level)}`}>{a.level}</span>
                </td>
                <td>
                  <Link to={`/employees/${a.id}`} className="btn" style={{ textDecoration: 'none' }}>
                    View profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
