import React, { useEffect, useState } from 'react'
import PredictionCard from '../components/PredictionCard'
import PredictionChart from '../components/PredictionChart'

type Point = { x: string; y: number }

export default function PricePredictions() {
  const [productId, setProductId] = useState('1')
  const [loading, setLoading] = useState(false)
  const [series, setSeries] = useState<Point[]>([])
  const [current, setCurrent] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/ai/price-forecast/${productId}`)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        // expect { series: [{date,price}], current }
        const s = (json.series || json.data || []).map((p: any) => ({ x: p.date || p.x, y: Number(p.price ?? p.y) }))
        setSeries(s)
        setCurrent(json.current ?? (s.length ? s[s.length - 1].y : null))
      } catch (e) {
        // fallback mock data
        const now = new Date()
        const mock = Array.from({ length: 12 }).map((_, i) => ({
          x: new Date(now.getTime() + i * 24 * 3600 * 1000).toISOString().slice(0, 10),
          y: Math.round(100 + Math.sin(i / 2) * 10 + i * 2),
        }))
        setSeries(mock)
        setCurrent(mock[mock.length - 1].y)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId])

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Prédictions de prix (IA)</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13 }}>Product ID</label>
        <input value={productId} onChange={e => setProductId(e.target.value)} style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border-light)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{loading ? 'Chargement...' : 'Données prêtes'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <PredictionCard title="Prix actuel estimé" value={current ?? '—'} note={`Produit ${productId}`} />
        <PredictionCard title="Horizon 7j" value={series.slice(-7).reduce((s, p) => s + p.y, 0) / Math.max(1, Math.min(7, series.length))} />
        <PredictionCard title="Horizon 30j" value={series.slice(-30).reduce((s, p) => s + p.y, 0) / Math.max(1, Math.min(30, series.length))} />
      </div>

      <div style={{ marginTop: 16 }}>
        <PredictionChart data={series} />
      </div>
    </div>
  )
}
