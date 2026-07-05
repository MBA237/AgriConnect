import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../services/api'

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await getMyOrders()
        if (active) setOrders(Array.isArray(res.data.orders) ? res.data.orders : [])
      } catch (err) {
        console.error('Erreur chargement commandes', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  if (loading) return <div className="card">Chargement...</div>

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Historique des commandes</h1>
          <div className="sub">Toutes vos commandes</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card">Aucune commande enregistrée.</div>
      ) : (
        orders.map(o => (
          <div className="card order-card" key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Réf. {o.id}</strong>
                <div style={{ color: 'var(--text-muted)' }}>{o.items?.length ?? 0} articles</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{o.total?.toLocaleString('fr-FR') ?? 0} FCFA</div>
                <Link to={`/orders/${o.id}`} className="btn-small btn-small-outline">Voir</Link>
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  )
}
