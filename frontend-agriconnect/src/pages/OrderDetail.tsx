import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderDetail } from '../services/api'
import { useToasts } from '../components/ToastProvider'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const toasts = useToasts()

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await getOrderDetail(id)
        setOrder(res.data.order)
      } catch (err) {
        console.error(err)
        toasts.push({ type: 'error', title: 'Erreur', message: 'Impossible de charger la commande.' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, toasts])

  if (loading) return <div className="card">Chargement de la commande...</div>
  if (!order) return <div className="card">Commande introuvable</div>

  return (
    <section className="page order-detail-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-file-invoice" style={{ color: 'var(--primary)' }}></i> Détail de la commande</h1>
          <div className="sub">Voir le statut et le détail de votre commande</div>
        </div>
      </div>

      <div className="card order-detail-card">
        <div className="order-summary-row"><span>Référence</span><strong>{order.id}</strong></div>
        <div className="order-summary-row"><span>Statut</span><strong>{order.status}</strong></div>
        <div className="order-summary-row"><span>Total</span><strong>{order.total?.toLocaleString?.('fr-FR') ?? 0} FCFA</strong></div>

        <div className="section-title"><i className="fas fa-box-open"></i> Articles</div>
        {order.items?.length ? (
          <div className="order-items-list">
            {order.items.map((item: any) => (
              <div key={item.productId} className="order-item-row">
                <div>
                  <strong>{item.title}</strong>
                  <div>{item.quantity} × {item.price.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div>{(item.quantity * item.price).toLocaleString('fr-FR')} FCFA</div>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun article trouvé.</p>
        )}

        <Link className="btn-small btn-small-outline" to="/orders/my">
          <i className="fas fa-arrow-left"></i> Retour à mes commandes
        </Link>
      </div>
    </section>
  )
}
