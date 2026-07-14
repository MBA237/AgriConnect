import React, { useEffect, useState } from 'react'
import PredictionCard from '../components/PredictionCard'
import PredictionChart from '../components/PredictionChart'

type Point = { x: string; y: number }

export default function YieldPredictions() {
  const [region, setRegion] = useState('north')
  const [loading, setLoading] = useState(false)
  const [series, setSeries] = useState<Point[]>([])
  const [estimate, setEstimate] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/ai/yield-forecast/${region}`)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        const s = (json.series || json.data || []).map((p: any) => ({ x: p.date || p.x, y: Number(p.yield ?? p.y) }))
        setSeries(s)
        setEstimate(json.estimate ?? (s.length ? s[s.length - 1].y : null))
      } catch (e) {
        // mock fallback
        const mock = Array.from({ length: 12 }).map((_, i) => ({ x: `2026-${(i + 1).toString().padStart(2, '0')}-01`, y: Math.round(10 + i * 0.5 + Math.random() * 2) }))
        setSeries(mock)
        setEstimate(mock[mock.length - 1].y)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [region])

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Prédiction de Récoltes (IA)</h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13 }}>Région</label>
        <input value={region} onChange={e => setRegion(e.target.value)} style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border-light)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{loading ? 'Chargement...' : 'Données prêtes'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <PredictionCard title="Estimation actuelle" value={estimate ?? '—'} note={`Région ${region}`} />
        <PredictionCard title="Moy. 7j" value={series.slice(-7).reduce((s, p) => s + p.y, 0) / Math.max(1, Math.min(7, series.length))} />
        <PredictionCard title="Moy. 30j" value={series.slice(-30).reduce((s, p) => s + p.y, 0) / Math.max(1, Math.min(30, series.length))} />
      </div>

      <div style={{ marginTop: 16 }}>
        <PredictionChart data={series} />
      </div>
    </div>
  )
}
