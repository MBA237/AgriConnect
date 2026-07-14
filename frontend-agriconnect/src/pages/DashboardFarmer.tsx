import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { getAnalyticsFarmer } from '../services/api'

export default function DashboardFarmer() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await getAnalyticsFarmer()
        if (mounted) setKpis(res.data || null)
      } catch (err) {
        // ignore
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
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Tableau de bord</p>
          <h1>Agriculteur</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <>
            <StatCard title="Revenu (30j)" value={kpis?.revenue30d ?? '—'} delta={kpis?.revenueDelta ?? 0} />
            <StatCard title="Volume vendu" value={kpis?.volumeSold ?? '—'} delta={kpis?.volumeDelta ?? 0} />
            <StatCard title="Contrats actifs" value={kpis?.activeContracts ?? '—'} />
            <StatCard title="Réputation" value={kpis?.rating ?? '—'} />
          </>
        )}
      </div>
    </section>
  )
}
