import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import InvestmentProgress from '../components/InvestmentProgress'
import { getCrowdfundingProject, investInProject } from '../services/api'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        if (!id) throw new Error('missing id')
        const res = await getCrowdfundingProject(id)
        const p = res?.data?.project ?? null
        if (mounted) setProject(p)
      } catch (err: any) {
        console.error(err)
        if (mounted) setError('Impossible de charger le projet')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  const handleInvest = async () => {
    if (!project) return
    setSubmitting(true)
    try {
      await investInProject({ projectId: project.id, amount })
      // refresh
      const res = await getCrowdfundingProject(project.id)
      setProject(res?.data?.project ?? project)
      alert('Investissement effectué')
    } catch (err: any) {
      console.error(err)
      alert('Échec de l\'investissement')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="card">Chargement du projet...</div>
  if (error) return <div className="card">{error}</div>
  if (!project) return <div className="card">Projet introuvable</div>

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Détail du projet</p>
          <h1>{project.title}</h1>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
            <div style={{ marginTop: 12 }}>
              <strong>Porteur:</strong> {project.owner}
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Deadline:</strong> {project.deadline ?? '—'}
            </div>
          </div>

          <aside>
            <InvestmentProgress raised={project.raised ?? 0} goal={project.goal ?? 0} />

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>Montant (FCFA)</label>
              <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 10, border: '1px solid var(--border-light)' }} />
              <button className="btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={handleInvest} disabled={submitting || amount <= 0}>{submitting ? '…' : 'Investir'}</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
