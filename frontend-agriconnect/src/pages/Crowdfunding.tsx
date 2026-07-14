import React, { useEffect, useState } from 'react'
import ProjectCard, { CrowdfundProject } from '../components/ProjectCard'
import { getCrowdfundingProjects } from '../services/api'

export default function Crowdfunding() {
  const [projects, setProjects] = useState<CrowdfundProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getCrowdfundingProjects()
        const items = Array.isArray(res?.data?.projects) ? res.data.projects : []
        if (mounted) setProjects(items)
      } catch (err: any) {
        console.error(err)
        if (mounted) setError('Impossible de charger les projets pour le moment')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Financement participatif</p>
          <h1>Projets</h1>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div>Chargement des projets...</div>
        ) : error ? (
          <div className="alert alert-error"><div className="alert-body"><div className="alert-message">{error}</div></div></div>
        ) : projects.length === 0 ? (
          <div>Aucun projet pour le moment.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
