import Layout from '../components/Layout'

const positions = [
  {
    title: 'Division Chief, Planning and Evaluation Service',
    candidates: ['Zacki Santos', 'Maria Cruz'],
  },
  {
    title: 'Regional Director, Region IV-A',
    candidates: ['John Reyes'],
  },
]

export default function TalentSuccession() {
  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Talent & Succession Planning</h1>
          <p className="page-subtitle">
            Identify potential successors for key positions based on competency data.
          </p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Positions Without Successor</div>
          <div className="stat-value">1</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High-Potential Flagged</div>
          <div className="stat-value">4</div>
        </div>
      </div>

      {positions.map((pos) => (
        <div className="card" key={pos.title}>
          <h2 className="card-title">{pos.title}</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {pos.candidates.map((name) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f9fafb',
                  border: '1px solid #e2e4e9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#e8f0fe',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {name.split(' ').map((n) => n[0]).join('')}
                </div>
                {name}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <h2 className="card-title">Chief Science Research Specialist, Central Office</h2>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>No successor identified.</p>
      </div>
    </Layout>
  )
}
