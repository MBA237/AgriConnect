import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useCart from '../hooks/useCart'

export default function Cart() {
  const { items, total, updateQuantity, removeFromCart, count } = useCart()
  const navigate = useNavigate()

  return (
    <section className="page cart-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-shopping-cart" style={{ color: 'var(--primary)' }}></i> Mon panier</h1>
          <div className="sub">Vérifiez vos articles et passez à la validation de commande.</div>
        </div>
        <div className="actions">
          <button className="btn-small btn-small-success" disabled={items.length === 0} onClick={() => navigate('/checkout')}>
            <i className="fas fa-credit-card"></i> Payer maintenant
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <p>Votre panier est vide.</p>
          <Link to="/catalog" className="btn-primary">
            <i className="fas fa-store"></i> Voir les produits
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card cart-items-card">
            <div className="section-title"><i className="fas fa-box-open"></i> Articles du panier</div>
            {items.map(item => (
              <div key={item.productId} className="cart-item">
                <img src={item.image} alt={item.title} />
                <div className="cart-item-details">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-meta">{item.farmerName} · {item.unit}</div>
                  <div className="cart-item-actions">
                    <button className="btn-small btn-small-outline" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="btn-small btn-small-outline" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    <button className="btn-small btn-small-danger" onClick={() => removeFromCart(item.productId)}>Supprimer</button>
                  </div>
                </div>
                <div className="cart-item-price">{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</div>
              </div>
            ))}
          </div>

          <div className="card cart-summary-card">
            <div className="section-title"><i className="fas fa-receipt"></i> Récapitulatif</div>
            <div className="summary-row"><span>Articles</span><span>{count}</span></div>
            <div className="summary-row"><span>Total</span><span>{total.toLocaleString('fr-FR')} FCFA</span></div>
            <button className="btn-primary" disabled={items.length === 0} onClick={() => navigate('/checkout')}>
              <i className="fas fa-credit-card"></i> Passer à la validation
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
