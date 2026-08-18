import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import InvestmentProgress from '../../components/InvestmentProgress'
import { getCrowdfundingProject, investInProject } from '../../services/api'
import { useToasts } from '../../components/ToastProvider'
import useSession from '../../hooks/useSession'
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const toasts = useToasts()
  const { session } = useSession()
  const isCreator = session.user?.id === project?.owner

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
      toasts.push({ type: 'success', title: 'Participation enregistrée', message: 'Votre investissement a bien été pris en compte.' })
    } catch (err: any) {
      console.error(err)
      toasts.push({ type: 'error', title: 'Participation impossible', message: err?.response?.data?.message || err?.response?.data?.error || 'Réessayez plus tard.' })
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
            {project.image ? <img className="project-detail-cover" src={project.image} alt={project.title} /> : null}
            <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
            <div style={{ marginTop: 12 }}>
              <strong>Porteur:</strong> {project.owner}
            </div>
            {isCreator ? <div className="alert alert-info" role="status">Vous êtes le porteur de ce projet. Vous ne pouvez pas investir dans votre propre projet.</div> : null}
            <div style={{ marginTop: 12 }}>
              <strong>Deadline:</strong> {project.deadline ?? '—'}
            </div>
          </div>

          <aside>
            <InvestmentProgress raised={project.raised ?? 0} goal={project.goal ?? 0} />

            {!isCreator ? <div className="project-invest-form">
              <label htmlFor="investment-amount">Montant (FCFA)</label>
              <input id="investment-amount" type="number" min="1" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} />
              <button className="btn-primary" onClick={handleInvest} disabled={submitting || amount <= 0}>{submitting ? 'Participation...' : 'Investir'}</button>
            </div> : null}
          </aside>
        </div>
      </div>
    </section>
  )
}
