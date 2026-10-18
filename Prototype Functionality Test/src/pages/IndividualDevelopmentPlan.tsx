import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'

const goals = [
  {
    title: 'Advanced Research Analytics & Big Data in S&T Planning',
    gap: 'Functional competency (R&D, laboratory, policy engineering) · 74% → 90% target',
    status: 'In Progress',
    progress: 68,
  },
  {
    title: 'Policy Formulation & Executive Briefing',
    gap: 'Leadership competency · target proficiency level 3',
    status: 'In Progress',
    progress: 52,
  },
  {
    title: 'Government Ethics and Integrity Certification',
    gap: 'Core competency (government and S&T integrity) · completed Aug 2026',
    status: 'Completed',
    progress: 100,
  },
]

export default function IndividualDevelopmentPlan() {
  const { id } = useParams()

  return (
    <Layout>
      <div className="breadcrumb">
        <Link to="/employees" style={{ color: '#6b7280' }}>Employee Directory</Link> &gt;{' '}
        <Link to={`/employees/${id}`} style={{ color: '#6b7280' }}>Zacki Santos</Link> &gt; Individual Development Plan
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Individual Development Plan</h1>
          <p className="page-subtitle">Zacki Santos &middot; Senior Science Research Specialist</p>
        </div>
        <button className="btn">Export Plan</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Active Goals</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overall Completion</div>
          <div className="stat-value">68%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Target Date</div>
          <div className="stat-value" style={{ fontSize: '15px' }}>Dec 15, 2026</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mentor</div>
          <div className="stat-value" style={{ fontSize: '15px' }}>R. Gomez</div>
        </div>
      </div>

      <h2 className="card-title">Development Goals</h2>
      {goals.map((goal) => (
        <div className="card" key={goal.title}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, maxWidth: '70%' }}>{goal.title}</div>
            <span className={`badge ${goal.status === 'Completed' ? 'badge-success' : 'badge-accent'}`}>
              {goal.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>{goal.gap}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${goal.progress}%` }} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{goal.progress}%</span>
          </div>
        </div>
      ))}
    </Layout>
  )
}
