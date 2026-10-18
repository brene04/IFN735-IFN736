// Administrative Admin / Executive › Competency Framework › Position–Competency Requirements
// Required proficiency level per competency for each DOST position.
// Only the Administrative Admin can edit; the Executive has a read-only view.
import { useState } from 'react'
import RoleShell from '../../components/RoleShell'
import { useAuth } from '../../auth/authContext'
import { roleHome } from '../../auth/users'
import { positions, save, useDb } from '../technical/techData'
import { PageHeader, StatRow, StatCard, Card, SearchBox, Notice, EmptyRow } from '../technical/techUi'
import { primaryBtn, ghostBtn, selectStyle, thStyle, tdStyle, infoBox, MUTED, BORDER, NAVY, SIDEBAR_ACTIVE } from '../technical/techTheme'
import { competencyByCode, requirementsFor } from '../office/officeData'
import { PriorityTag, LevelBlocks, CategoryTag } from '../office/officeUi'

export default function PositionMapping() {
  const { user } = useAuth()
  const db = useDb()
  const canEdit = user?.role === 'administrative_admin'
  const [selectedTitle, setSelectedTitle] = useState(positions[0].title)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, number>>({})
  const [notice, setNotice] = useState('')

  const list = positions.filter((p) => !search.trim() || p.title.toLowerCase().includes(search.trim().toLowerCase()))
  const selected = positions.find((p) => p.title === selectedTitle) ?? positions[0]
  const reqs = requirementsFor(selected.title)
  const levels = db.config.proficiencyLevels

  const mapped = positions.filter((p) => requirementsFor(p.title).length > 0).length
  const unmapped = positions.length - mapped
  const all = positions.flatMap((p) => requirementsFor(p.title))
  const avg = all.length ? (all.reduce((s, r) => s + r.level, 0) / all.length).toFixed(1) : '0'

  function select(title: string) {
    setSelectedTitle(title)
    setEditing(false)
    setDraft({})
  }
  function startEdit() {
    setDraft(Object.fromEntries(reqs.map((r) => [r.code, r.level])))
    setEditing(true)
  }
  function saveEdit() {
    // tbl_position_competencies.required_level
    save(
      (d) => {
        const pos = d.positions.find((p) => p.positionTitle === selected.title)
        if (!pos) return
        d.positionCompetencies.forEach((r) => {
          const code = d.competencies.find((c) => c.id === r.competencyId)?.competencyCode
          if (r.positionId === pos.id && code && draft[code]) r.requiredLevel = draft[code]
        })
      },
      { event: 'Config Change', details: `Updated required levels for ${selected.title}` },
    )
    setEditing(false)
    setNotice(`Requirements for ${selected.title} saved.`)
  }

  return (
    <RoleShell>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: roleHome[user?.role ?? 'administrative_admin'] }, { label: 'Competency Framework' }, { label: 'Position–Competency Requirements' }]}
        title="Position–Competency Requirements"
        description="Required proficiency level for each competency, per position."
        actions={
          canEdit && selected && reqs.length > 0 && (
            editing ? (
              <>
                <button style={ghostBtn} onClick={() => setEditing(false)}>Cancel</button>
                <button style={primaryBtn} onClick={saveEdit}>Save Changes</button>
              </>
            ) : (
              <button style={primaryBtn} onClick={startEdit}>Edit Requirements</button>
            )
          )
        }
      />
      {notice && <Notice text={notice} onClose={() => setNotice('')} />}

      <StatRow>
        <StatCard label="Positions" value={positions.length} icon="id" />
        <StatCard label="Mapped" value={mapped} icon="check" tone="success" />
        <StatCard label="Unmapped" value={unmapped} icon="alert" tone={unmapped ? 'warning' : 'success'} />
        <StatCard label="Average Required Level" value={avg} unit="/ 4" icon="dashboard" />
      </StatRow>

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '20px', alignItems: 'start', marginTop: '20px' }}>
        <Card title="Positions" subtitle={`${list.length} DOST positions`} flush>
          <div style={{ padding: '0 16px 12px' }}>
            <SearchBox value={search} onChange={setSearch} placeholder="Find a position..." />
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}` }}>
            {list.map((p) => {
              const on = p.title === selected.title
              const n = requirementsFor(p.title).length
              return (
                <button
                  key={p.title}
                  onClick={() => select(p.title)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid #eceef2', background: on ? '#eef4fa' : 'white', borderLeft: `4px solid ${on ? SIDEBAR_ACTIVE : 'transparent'}`, cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', fontWeight: on ? 700 : 600, color: '#111827', fontSize: '13.5px' }}>{p.title}</span>
                  <span style={{ fontSize: '12px', color: n ? MUTED : '#a12424' }}>SG {p.salaryGrade} · {n ? `${n} competencies` : 'Not mapped'}</span>
                </button>
              )
            })}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title={selected.title} subtitle={`Salary Grade ${selected.salaryGrade} · ${reqs.length} required competencies`} flush>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>CODE</th>
                    <th style={thStyle}>COMPETENCY</th>
                    <th style={thStyle}>CATEGORY</th>
                    <th style={thStyle}>PRIORITY</th>
                    <th style={thStyle}>REQUIRED LEVEL</th>
                  </tr>
                </thead>
                <tbody>
                  {reqs.length === 0 && <EmptyRow colSpan={5} text="No requirements mapped for this position yet." />}
                  {reqs.map((r) => {
                    const c = competencyByCode(r.code)
                    const lvl = editing ? draft[r.code] ?? r.level : r.level
                    return (
                      <tr key={r.code}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: NAVY }}>{r.code}</td>
                        <td style={tdStyle}>{c?.title ?? r.code}</td>
                        <td style={tdStyle}>{c && <CategoryTag category={c.category} />}</td>
                        <td style={tdStyle}><PriorityTag priority={r.priority} /></td>
                        <td style={tdStyle}>
                          {editing ? (
                            <select style={{ ...selectStyle, width: '170px' }} value={lvl} onChange={(e) => setDraft({ ...draft, [r.code]: Number(e.target.value) })}>
                              {levels.map((l, i) => <option key={l.name} value={i + 1}>L{i + 1} {l.name}</option>)}
                            </select>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <LevelBlocks current={lvl} />
                              <span style={{ fontSize: '13px' }}>L{lvl} {levels[lvl - 1]?.name}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Proficiency Levels">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {levels.map((l, i) => (
                <div key={l.name} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontWeight: 700, color: NAVY }}>L{i + 1} · {l.name}</div>
                  <div style={{ fontSize: '12.5px', color: MUTED, marginTop: '4px' }}>{l.description}</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={infoBox}>
            {canEdit
              ? 'Next step: run Gap Analysis once positions are mapped and employee levels are recorded.'
              : 'Read-only view. Position requirements are maintained by the Administrative Admin.'}
          </div>
        </div>
      </div>
    </RoleShell>
  )
}
