import React from 'react'
import './ProjectCard.css'
import { Link } from 'react-router-dom'
import type { CrowdfundProject } from '../services/api'

export default function ProjectCard({ project }: { project: CrowdfundProject }) {
  const pct = project.goal > 0 ? Math.min(100, Math.round((project.raised / project.goal) * 100)) : 0
  const statusLabel = project.status ?? 'En cours'
  const category = project.category ?? project.sector ?? 'Projet agricole'
  const ownerName = project.owner ?? 'Équipe du projet'
  const location = project.location ?? 'Yaoundé'
  const summary = project.summary ?? project.description ?? 'Projet agricole avec fort impact local.'
  const investorCount = project.investorsCount ?? 12
  const returnRate = project.returnRate ?? '15% de la récolte'
  const minimumInvestment = project.minimumInvestment ?? 100000
  const tags = project.tags ?? ['Durable', 'Impact local']
  const features = Array.isArray(project.details) && project.details.length > 0
    ? project.details
    : [project.area, project.irrigation, project.greenhouse].filter(Boolean) as string[]

  return (
    <div className="card" style={{ display: 'grid', gap: 14, padding: 0, overflow: 'hidden', borderRadius: 18 }}>
      <div style={{ position: 'relative', height: 200, background: 'var(--bg-input)' }}>
        {project.image ? (
          <img src={project.image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>
            Projet agricole
          </div>
        )}
        <span style={{ position: 'absolute', top: 12, left: 12, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
          {statusLabel}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 12, padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{project.title}</div>
            <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>{ownerName} · {category}</div>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: 12 }}>
            <div>{location}</div>
            <div>{investorCount} investisseurs</div>
          </div>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{summary}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map(tag => (
            <span key={tag} style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(47, 82, 51, 0.1)', color: 'var(--primary)', fontSize: 12 }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {features.map(feature => (
            <div key={feature} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', fontSize: 13 }}>
              {feature}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {project.raised.toLocaleString('fr-FR')} / {project.goal.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {pct}% financé
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to={`/crowdfunding/${project.id}`} className="btn-primary">Investir</Link>
            <Link to={`/crowdfunding/${project.id}`} className="btn-small btn-small-outline">Détails</Link>
          </div>
        </div>

        <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,var(--primary),var(--primary-light))' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span>Investissement min. : {minimumInvestment.toLocaleString('fr-FR')} FCFA</span>
          <span>Retour : {returnRate}</span>
        </div>
      </div>
    </div>
  )
}
