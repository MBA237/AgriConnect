import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../services/api'
import { useToasts } from '../components/ToastProvider'

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toasts = useToasts()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await getMyOrders()
        setOrders(Array.isArray(res.data.orders) ? res.data.orders : [])
      } catch (err) {
        console.error(err)
        toasts.push({ type: 'error', title: 'Erreur', message: 'Impossible de charger vos commandes.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toasts])

  return (
    <section className="page my-orders-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-shopping-bag" style={{ color: 'var(--primary)' }}></i> Mes commandes</h1>
          <div className="sub">Suivez le statut de vos commandes récentes.</div>
        </div>
      </div>

      {loading ? (
        <div className="card">Chargement de vos commandes...</div>
      ) : orders.length === 0 ? (
        <div className="card">
          <p>Aucune commande trouvée pour le moment.</p>
          <Link className="btn-primary" to="/catalog">
            <i className="fas fa-store"></i> Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order.id} className="card order-card">
              <div className="order-card-top">
                <span>Réf. {order.id}</span>
                <span className={`badge-${order.status === 'pending' ? 'warning' : order.status === 'success' ? 'success' : 'danger'}`}>
                  {order.status}
                </span>
              </div>
              <div>{order.items?.length ?? 0} articles · {order.total?.toLocaleString?.('fr-FR') ?? 0} FCFA</div>
              <Link className="btn-small btn-small-outline" to={`/orders/${order.id}`}>
                <i className="fas fa-eye"></i> Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
