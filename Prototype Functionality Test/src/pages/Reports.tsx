import Layout from '../components/Layout'

const reports = [
  'Workforce Analytics Summary',
  'Unit Gap Analysis Report',
  'Succession Readiness Report',
  'IDP Completion Report',
]

export default function Reports() {
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Decision Support</h1>
          <p className="page-subtitle">
            Generate structured reports on workforce competency data to support decision-making.
          </p>
        </div>
      </div>

      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Generated This Quarter</div>
          <div className="stat-value">27</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value">4</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Report Template</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r}>
                <td>{r}</td>
                <td>
                  <button className="btn btn-primary">Generate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
