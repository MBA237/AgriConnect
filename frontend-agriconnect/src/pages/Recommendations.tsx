import React, { useState } from 'react'
import PredictionCard from '../components/PredictionCard'

export default function Recommendations() {
  const [productId, setProductId] = useState('1')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<string[]>([])

  async function fetchRec() {
    setLoading(true)
    try {
      const res = await fetch(`/api/ai/recommendations/${productId}`)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setItems(json.recommendations || json || [])
    } catch (e) {
      setItems([`Acheter plus de ${productId} si prix < 90`, `Vendre si tendance haussière`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Recommandations (IA)</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13 }}>Product ID</label>
        <input value={productId} onChange={e => setProductId(e.target.value)} style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border-light)' }} />
        <button onClick={fetchRec} className="btn-primary">{loading ? '...' : 'Obtenir'}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
        <PredictionCard title="Produit" value={productId} />
        <div className="card">
          <h3 style={{ fontWeight: 800 }}>Recommandations</h3>
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {items.map((it, idx) => (
              <li key={idx} style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>{it}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
