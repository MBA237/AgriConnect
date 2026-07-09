import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getTraceabilityByQrCode } from '../services/api'

export default function TraceabilityDetail() {
  const { qrCode } = useParams<{ qrCode: string }>()
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!qrCode) return
      try {
        setLoading(true)
        const response = await getTraceabilityByQrCode(qrCode)
        setEntry(response?.data?.entry || response?.data)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Impossible de charger la traçabilité.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [qrCode])

  if (loading) return <main className="page-content"><section className="card">Chargement...</section></main>
  if (error) return <main className="page-content"><section className="card">{error}</section></main>
  if (!entry) return <main className="page-content"><section className="card">Aucune information trouvée.</section></main>

  return (
    <main className="page-content">
      <section className="card space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Traçabilité</p>
          <h1>Détail de traçabilité</h1>
        </div>

        <div className="card">
          <h3>{entry.productName || 'Lot non identifié'}</h3>
          <p><strong>QR code :</strong> {entry.qrCode}</p>
          <p><strong>Produit :</strong> {entry.productId}</p>
          <p><strong>Emplacement :</strong> {entry.location}</p>
          <p><strong>Statut :</strong> {entry.status}</p>
          {entry.note ? <p><strong>Note :</strong> {entry.note}</p> : null}
          {entry.createdAt ? <p><strong>Enregistré le :</strong> {entry.createdAt}</p> : null}
        </div>

        <div className="card">
          <h3>Timeline de traçabilité</h3>
          <div className="order-timeline">
            {[
              { label: 'Enregistré', done: true },
              { label: 'Collecté', done: true },
              { label: 'Transporté', done: Boolean(entry.location) },
              { label: 'Livré', done: entry.status === 'Livré' || entry.status === 'completed' },
            ].map((step, index) => (
              <div key={step.label} className={`order-step ${step.done ? 'active' : ''}`}>
                <div className="step-dot" />
                <div className="step-label">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
