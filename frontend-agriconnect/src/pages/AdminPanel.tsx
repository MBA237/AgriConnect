import React, { useEffect, useState } from 'react'
import { getAnalyticsAdmin, getAdminUsers, updateAdminUser, moderateProduct } from '../services/api'
import StatCard from '../components/StatCard'

export default function AdminPanel() {
  const [kpis, setKpis] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await getAnalyticsAdmin()
        const u = await getAdminUsers()
        if (mounted) {
          setKpis(res.data || null)
          setUsers(Array.isArray(u.data?.users) ? u.data.users : [])
        }
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const toggleUserActive = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (!user) return
    const updated = { ...user, active: !user.active }
    try {
      await updateAdminUser(id, updated)
      setUsers(prev => prev.map(p => (p.id === id ? updated : p)))
    } catch {}
  }

  const handleModerate = async (productId: string) => {
    try {
      await moderateProduct({ productId, action: 'flag' })
      // show basic confirmation
      alert('Produit modéré (signalé)')
    } catch {}
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Administration</p>
          <h1>Panneau d'administration</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12 }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <StatCard title="Utilisateurs" value={kpis?.usersCount ?? 0} />
            <StatCard title="Produits" value={kpis?.productsCount ?? 0} />
            <StatCard title="Transactions" value={kpis?.transactionsCount ?? 0} />
          </div>

          <div style={{ marginTop: 12 }} className="card">
            <h3>Graphique simple des revenus</h3>
            <div style={{ height: 180 }}>
              {/* simple bar chart */}
              <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
                {(kpis?.revenueSeries || [5, 8, 6, 9, 12, 10]).map((v: number, i: number) => (
                  <rect key={i} x={(i * 16) + 2} y={20 - v} width={10} height={v} fill="var(--accent)" />
                ))}
              </svg>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="card">
            <h3>Utilisateurs</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{u.name || u.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.role}</div>
                  </div>
                  <div>
                    <button className="btn-small" onClick={() => toggleUserActive(u.id)}>{u.active ? 'Désactiver' : 'Activer'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Modération produits</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Signaler rapidement un produit</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input placeholder="Product ID" id="_mod_pid" style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid var(--border-light)' }} />
              <button className="btn-primary" onClick={() => { const v = (document.getElementById('_mod_pid') as HTMLInputElement)?.value; if (v) handleModerate(v) }}>Signaler</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
