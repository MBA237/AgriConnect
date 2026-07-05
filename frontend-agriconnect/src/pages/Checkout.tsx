import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCart from '../hooks/useCart'
import PaymentMethodSelector, { type PaymentMethod } from '../components/PaymentMethodSelector'
import { createOrder, initiatePayment, initiateOrangePayment } from '../services/api'
import { useToasts } from '../components/ToastProvider'

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo')
  const [phone, setPhone] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const toasts = useToasts()

  const handleSubmit = async () => {
    if (items.length === 0) return

    setLoading(true)
    setStatus('pending')
    setPaymentMessage('Initialisation du paiement...')

    try {
      const orderRes = await createOrder({
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity, unit: item.unit, price: item.price })),
        total,
      })

      let paymentRes: any
      if (paymentMethod === 'orange_money') {
        // Orange Money requires a phone number
        if (!phone) throw new Error('Téléphone requis pour Orange Money')
        paymentRes = await initiateOrangePayment({ orderId: orderRes.data.order.id, phone, amount: total })
      } else {
        paymentRes = await initiatePayment({
          orderId: orderRes.data.order.id,
          method: paymentMethod,
        })
      }

      setStatus('success')
      setPaymentMessage(`Paiement initié avec succès. Référence : ${paymentRes?.data?.reference || 'N/A'}`)
      clearCart()
      toasts.push({ type: 'success', title: 'Paiement démarré', message: 'Votre commande est en cours de traitement.' })
      navigate(`/orders/${orderRes.data.order.id}`)
    } catch (err) {
      console.error('Erreur paiement:', err)
      setStatus('failed')
      setPaymentMessage('Une erreur est survenue lors de l’initiation du paiement.')
      toasts.push({ type: 'error', title: 'Paiement échoué', message: 'Impossible d’initier le paiement pour le moment.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page checkout-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-receipt" style={{ color: 'var(--primary)' }}></i> Validation de commande</h1>
          <div className="sub">Confirmez votre panier et choisissez votre moyen de paiement.</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p>Votre panier est vide. Ajoutez d’abord des articles avant de valider la commande.</p>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="card checkout-cart-card">
            <div className="section-title"><i className="fas fa-box-open"></i> Contenu de la commande</div>
            {items.map(item => (
              <div key={item.productId} className="checkout-item-row">
                <div>
                  <strong>{item.title}</strong>
                  <div>{item.quantity} × {item.price.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div>{(item.quantity * item.price).toLocaleString('fr-FR')} FCFA</div>
              </div>
            ))}
            <div className="checkout-total-row">
              <span>Total</span>
              <strong>{total.toLocaleString('fr-FR')} FCFA</strong>
            </div>
          </div>

          <div className="card checkout-payment-card">
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

            {paymentMethod === 'orange_money' && (
              <div style={{ marginTop: 12 }}>
                <label>Téléphone Orange</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +237699000000" />
              </div>
            )}

            <div className="section-title"><i className="fas fa-info-circle"></i> État du paiement</div>
            <div className={`payment-status ${status}`}> 
              {status === 'idle' && 'Prêt à initier le paiement.'}
              {status === 'pending' && 'Paiement en cours d’initialisation...'}
              {status === 'success' && 'Paiement initié avec succès.'}
              {status === 'failed' && 'Le paiement a échoué.'}
            </div>
            {paymentMessage && <p className="payment-message">{paymentMessage}</p>}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Traitement...' : 'Confirmer et payer'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
