import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QrScanner from '../components/QrScanner'
import { createTraceabilityEntry, getTraceabilityHistoryByProduct } from '../services/api'

type TraceabilityItem = {
  id: string
  qrCode: string
  productId: string
  productName: string
  location: string
  status: string
  note?: string
  createdAt?: string
}

export default function Traceability() {
  const [entries, setEntries] = useState<TraceabilityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    try {
      setLoading(true)
      const response = await getTraceabilityHistoryByProduct('demo-product')
      const items = Array.isArray(response?.data?.history) ? response.data.history : []
      setEntries(items)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Impossible de charger l’historique.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadHistory() }, [])

  const handleScan = async (qrCode: string) => {
    try {
      const response = await createTraceabilityEntry({ qrCode, productId: 'demo-product', productName: 'Maïs local', location: 'Yaoundé', status: 'En cours', note: 'Lot enregistré' })
      if (response?.data?.entry?.qrCode) {
        window.location.assign(`/traceability/${response.data.entry.qrCode}`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Échec de l’enregistrement du lot.')
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Traçabilité</p>
          <h1>Page de traçabilité</h1>
        </div>
      </div>

      <div className="card space-y-6">
        <QrScanner onScan={handleScan} />

        {error ? (
          <div className="alert alert-error">
            <div className="alert-body">
              <div className="alert-title">Erreur</div>
              <div className="alert-message">{error}</div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <h2>Historique récent</h2>
          {loading ? (
            <p>Chargement...</p>
          ) : entries.length === 0 ? (
            <div className="card">Aucun lot enregistré pour le moment.</div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{entry.productName}</strong>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{entry.location}</div>
                  </div>
                  <Link to={`/traceability/${entry.qrCode}`} className="btn-outline">Voir</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
