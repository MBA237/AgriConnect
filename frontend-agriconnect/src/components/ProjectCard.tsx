import React from 'react'
import { Link } from 'react-router-dom'

export type CrowdfundProject = {
  id: string
  title: string
  summary?: string
  goal: number
  raised: number
  owner?: string
  deadline?: string
  image?: string
}

export default function ProjectCard({ project }: { project: CrowdfundProject }) {
  const pct = project.goal > 0 ? Math.min(100, Math.round((project.raised / project.goal) * 100)) : 0
  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 96, height: 72, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-input)' }}>
          {project.image ? <img src={project.image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{project.title}</div>
          <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>{project.summary ?? ''}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{(project.raised).toLocaleString('fr-FR')} / {(project.goal).toLocaleString('fr-FR')} FCFA</div>
            <div style={{ marginLeft: 'auto' }}><Link to={`/crowdfunding/${project.id}`} className="btn-small btn-small-outline">Voir</Link></div>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,var(--primary),var(--primary-light))' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
