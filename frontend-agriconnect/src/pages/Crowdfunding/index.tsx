import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from '../../components/ProjectCard'
import { createCrowdfundingProject, getCrowdfundingProjects, type CrowdfundProject } from '../../services/api'
import useSession from '../../hooks/useSession'
import { useToasts } from '../../components/ToastProvider'
import './Crowdfunding.css';

export default function Crowdfunding() {
  const [projects, setProjects] = useState<CrowdfundProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', goal: '', deadline: '', category: 'Production agricole', location: '' })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const { session } = useSession()
  const navigate = useNavigate()
  const toasts = useToasts()
  const isFarmer = session.user?.role === 'agriculteur'
  const visibleProjects = projects.slice(0, 3)

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

  const submitProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim() || Number(form.goal) <= 0 || !coverImage) {
      setError('Renseignez les informations du projet et ajoutez une image de couverture.')
      return
    }
    try {
      setSaving(true)
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(coverImage)
      })
      const response = await createCrowdfundingProject({ ...form, goal: Number(form.goal), image })
      toasts.push({ type: 'success', title: 'Projet publié', message: 'Votre projet de financement est disponible.' })
      navigate(`/crowdfunding/${response.data.project.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Impossible de créer le projet.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Financement participatif</p>
          <h1>Projets</h1>
        </div>
        {isFarmer ? <button className="btn-primary" type="button" onClick={() => setShowForm(value => !value)}>{showForm ? 'Fermer' : 'Créer un projet'}</button> : null}
      </div>

      {showForm ? <div className="card crowdfunding-form-card">
        <form className="crowdfunding-form" onSubmit={submitProject}>
          <div className="grid-2">
            <div className="input-group"><label>Titre du projet *</label><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required placeholder="Ex. Extension de ma ferme" /></div>
            <div className="input-group"><label>Objectif (FCFA) *</label><input type="number" min="1" value={form.goal} onChange={event => setForm({ ...form, goal: event.target.value })} required /></div>
          </div>
          <div className="grid-2">
            <div className="input-group"><label>Catégorie</label><input value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} /></div>
            <div className="input-group"><label>Localisation</label><input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder="Dschang" /></div>
          </div>
          <div className="input-group"><label>Date limite</label><input type="date" value={form.deadline} onChange={event => setForm({ ...form, deadline: event.target.value })} /></div>
          <div className="input-group"><label htmlFor="project-cover">Image de couverture *</label><input id="project-cover" type="file" accept="image/*" required onChange={event => { const file = event.target.files?.[0] ?? null; setCoverImage(file); setCoverPreview(file ? URL.createObjectURL(file) : '') }} />{coverPreview ? <img className="project-cover-preview" src={coverPreview} alt="Aperçu de la couverture" /> : null}</div>
          <div className="input-group"><label>Description *</label><textarea rows={4} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} required placeholder="Présentez votre besoin de financement..." /></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Publication...' : 'Publier le projet'}</button>
        </form>
      </div> : null}

      <div className="card">
        {loading ? (
          <div>Chargement des projets...</div>
        ) : error ? (
          <div className="alert alert-error"><div className="alert-body"><div className="alert-message">{error}</div></div></div>
        ) : projects.length === 0 ? (
          <div>Aucun projet pour le moment.</div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {visibleProjects.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
            {projects.length > 3 ? (
              <div style={{ gridColumn: 'span 2', border: '1px dashed var(--border-light)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(47,82,51,0.06), rgba(255,255,255,0.7))' }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Créez votre projet</div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 420 }}>
                  Financez votre production agricole avec le soutien de la communauté.
                </div>
                {isFarmer ? <button className="btn-primary" type="button" onClick={() => setShowForm(true)}>Créer un projet</button> : <span className="badge">Les projets sont publiés par les agriculteurs</span>}
              </div>
            ) : (
              <div style={{ gridColumn: 'span 2', border: '1px dashed var(--border-light)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(47,82,51,0.06), rgba(255,255,255,0.7))' }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Créez votre projet</div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 420 }}>
                  Financez votre production agricole avec le soutien de la communauté.
                </div>
                {isFarmer ? <button className="btn-primary" type="button" onClick={() => setShowForm(true)}>Créer un projet</button> : <span className="badge">Les projets sont publiés par les agriculteurs</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
