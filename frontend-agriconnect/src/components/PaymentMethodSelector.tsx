import React from 'react'

export type PaymentMethod = 'mtn_momo' | 'mobile_money' | 'card' | 'orange_money'

const methods: Array<{ id: PaymentMethod; label: string; description: string; icon: string }> = [
  { id: 'mtn_momo', label: 'MTN MoMo', description: 'Paiement mobile rapide', icon: 'fa-mobile-alt' },
  { id: 'mobile_money', label: 'Mobile Money', description: 'Payer avec un portefeuille mobile', icon: 'fa-wallet' },
  { id: 'orange_money', label: 'Orange Money', description: 'Payer via Orange Money', icon: 'fa-phone' },
  { id: 'card', label: 'Carte bancaire', description: 'Visa / Mastercard', icon: 'fa-credit-card' },
]

export default function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}) {
  return (
    <div className="card payment-method-card" style={{ padding: 16 }}>
      <div className="section-title"><i className="fas fa-hand-holding-usd"></i> Choisissez un moyen de paiement</div>
      <div className="payment-method-grid">
        {methods.map(method => (
          <button
            key={method.id}
            type="button"
            className={`payment-method-item${value === method.id ? ' active' : ''}`}
            onClick={() => onChange(method.id)}
          >
            <div className="payment-method-icon"><i className={`fas ${method.icon}`}></i></div>
            <div>
              <div className="payment-method-title">{method.label}</div>
              <div className="payment-method-desc">{method.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
