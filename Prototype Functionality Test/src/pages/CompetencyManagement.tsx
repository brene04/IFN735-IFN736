import Layout from '../components/Layout'

const competencies = [
  { name: 'Government & S&T Integrity', category: 'Core', levels: 4, updated: 'Aug 2026' },
  { name: 'R&D and Laboratory Practice', category: 'Functional', levels: 4, updated: 'Jul 2026' },
  { name: 'Policy Formulation', category: 'Leadership', levels: 4, updated: 'Aug 2026' },
]

export default function CompetencyManagement() {
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Competency Management</h1>
          <p className="page-subtitle">
            Manage the DOST Competency Framework, proficiency levels, and behavioural indicators.
          </p>
        </div>
        <button className="btn btn-primary">+ Add Competency</button>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Total Competencies</div>
          <div className="stat-value">48</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">3</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Competency</th>
              <th>Category</th>
              <th>Proficiency Levels</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {competencies.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.category}</td>
                <td>{c.levels}</td>
                <td>{c.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
