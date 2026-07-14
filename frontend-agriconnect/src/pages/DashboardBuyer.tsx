import React, { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { getAnalyticsBuyer } from '../services/api'

export default function DashboardBuyer() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await getAnalyticsBuyer()
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
          <h1>Acheteur</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <>
            <StatCard title="Dépenses (30j)" value={kpis?.spend30d ?? '—'} delta={kpis?.spendDelta ?? 0} />
            <StatCard title="Commandes" value={kpis?.ordersCount ?? '—'} />
            <StatCard title="Fournisseurs actifs" value={kpis?.activeSuppliers ?? '—'} />
            <StatCard title="Économie réalisée" value={kpis?.savings ?? '—'} />
          </>
        )}
      </div>
    </section>
  )
}
