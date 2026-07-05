import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrderDetail } from '../services/api'
import OrderStatus from '../components/OrderStatus'

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await getOrderDetail(id)
        if (active) setOrder(res.data.order ?? null)
      } catch (err) {
        console.error('Erreur chargement commande', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  if (loading) return <div className="card">Chargement...</div>
  if (!order) return <div className="card">Commande introuvable</div>

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Suivi de commande</h1>
          <div className="sub">Réf. {order.id}</div>
        </div>
        <div className="actions">
          <Link className="btn-small btn-small-outline" to="/orders">Retour</Link>
        </div>
      </div>

      <div className="card">
        <OrderStatus status={order.status ?? 'placed'} />
        <div style={{ marginTop: 18 }}>
          <h3>Détails</h3>
          <div>Statut: {order.status}</div>
          <div>Total: {order.total?.toLocaleString('fr-FR') ?? 0} FCFA</div>
        </div>
      </div>
    </section>
  )
}
