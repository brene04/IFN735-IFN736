import Layout from '../components/Layout'

const programs = [
  { name: 'Advanced Data Analytics for Policy Research', duration: '3 months', status: 'Active' },
  { name: 'Executive Leadership Program', duration: '6 months', status: 'Active' },
  { name: 'S&T Project Management Certification', duration: '2 months', status: 'Active' },
  { name: 'Government Ethics and Integrity Workshop', duration: '1 week', status: 'Completed' },
]

const officeCompletion = [
  { office: 'PES', staff: 112, completion: 82 },
  { office: 'Central Office', staff: 88, completion: 74 },
  { office: 'Region IV-A', staff: 76, completion: 65 },
  { office: 'Region VII', staff: 66, completion: 58 },
]

export default function DevelopmentManagement() {
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Development Management</h1>
          <p className="page-subtitle">
            Manage training programs and monitor development plan progress across DOST offices.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn">Export</button>
          <button className="btn btn-primary">+ Add Program</button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Active IDPs</div>
          <div className="stat-value">342</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: '#c5221f' }}>18</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Programs</div>
          <div className="stat-value">56</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Completion</div>
          <div className="stat-value">71%</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h2 className="card-title">Training Catalog</h2>
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.duration}</td>
                  <td>
                    <span className={`badge ${p.status === 'Active' ? 'badge-accent' : 'badge-success'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="card-title">Average IDP Completion</h2>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '-8px', marginBottom: '12px' }}>
            By office, across all staff
          </p>
          {officeCompletion.map((o) => (
            <div key={o.office} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>{o.office} <span style={{ color: '#9ca3af' }}>({o.staff} staff)</span></span>
                <span>{o.completion}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${o.completion}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
