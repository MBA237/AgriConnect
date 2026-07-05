import React, { useState } from 'react'
import { createLimitOrder } from '../services/api'
import { useToasts } from './ToastProvider'

type LimitOrderFormProps = {
  productId: string
  productTitle: string
  currentPrice: number
  unit: string
  onOrderCreated: () => void
}

export default function LimitOrderForm({
  productId,
  productTitle,
  currentPrice,
  unit,
  onOrderCreated,
}: LimitOrderFormProps) {
  const toasts = useToasts()
  const [quantity, setQuantity] = useState<number | string>('')
  const [limitPrice, setLimitPrice] = useState<number | string>('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!quantity || Number(quantity) <= 0) newErrors.quantity = 'La quantité doit être supérieure à 0'
    if (!limitPrice || Number(limitPrice) <= 0) newErrors.limitPrice = 'Le prix limite doit être supérieur à 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)
    try {
      await createLimitOrder({
        productId,
        limitPrice: Number(limitPrice),
        quantity: Number(quantity),
      })
      toasts.push({
        type: 'success',
        title: 'Ordre créé',
        message: `Votre ordre pour ${quantity} ${unit} à ${limitPrice} FCFA a été créé.`,
      })
      setQuantity('')
      setLimitPrice('')
      onOrderCreated()
    } catch (err) {
      toasts.push({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer l\'ordre.',
      })
    } finally {
      setSaving(false)
    }
  }

  const priceDiff = Number(limitPrice) - currentPrice
  const priceDiffPercent = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(2) : '0'
  const isDiscounted = priceDiff < 0

  return (
    <div className="limit-order-form card">
      <div className="form-header">
        <h3><i className="fas fa-arrow-down"></i> Ordre à prix limite</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          {productTitle} - Prix actuel: {currentPrice.toLocaleString('fr-FR')} FCFA/{unit}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div className="input-group">
            <label>Quantité ({unit}) *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }))
              }}
              placeholder="Ex. 50"
              min="1"
              className={errors.quantity ? 'error' : ''}
            />
            {errors.quantity && (
              <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.quantity}</span>
            )}
          </div>

          <div className="input-group">
            <label>Prix limite (FCFA) *</label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => {
                setLimitPrice(e.target.value)
                if (errors.limitPrice) setErrors(prev => ({ ...prev, limitPrice: '' }))
              }}
              placeholder={currentPrice.toString()}
              min="0"
              className={errors.limitPrice ? 'error' : ''}
            />
            {errors.limitPrice && (
              <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.limitPrice}</span>
            )}
          </div>
        </div>

        {limitPrice && currentPrice > 0 && (
          <div className={`order-info ${isDiscounted ? 'discount' : 'premium'}`} style={{
            padding: 10,
            borderRadius: 'var(--radius-sm)',
            marginBottom: 12,
            backgroundColor: isDiscounted ? 'rgba(46, 107, 65, 0.1)' : 'rgba(163, 59, 43, 0.1)',
            borderLeft: `4px solid ${isDiscounted ? 'var(--success)' : 'var(--danger)'}`,
            fontSize: 13,
          }}>
            {isDiscounted ? (
              <>
                <i className="fas fa-check-circle"></i> Ordre d'achat
                <br />
                <strong>Économie: {Math.abs(priceDiff)} FCFA ({priceDiffPercent}%)</strong>
              </>
            ) : (
              <>
                <i className="fas fa-info-circle"></i> Prix supérieur
                <br />
                <strong>Prix augmenté de {priceDiff} FCFA ({priceDiffPercent}%)</strong>
              </>
            )}
          </div>
        )}

        <div className="order-summary" style={{
          padding: 12,
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Quantité commandée:</span>
            <strong>{quantity ? `${Number(quantity).toLocaleString('fr-FR')} ${unit}` : '-'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Prix unitaire limite:</span>
            <strong>{limitPrice ? `${Number(limitPrice).toLocaleString('fr-FR')} FCFA` : '-'}</strong>
          </div>
          <div style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>Coût total estimé:</span>
            <strong style={{ color: 'var(--primary)', fontSize: 16 }}>
              {quantity && limitPrice
                ? `${(Number(quantity) * Number(limitPrice)).toLocaleString('fr-FR')} FCFA`
                : '-'}
            </strong>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !quantity || !limitPrice}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          <i className="fas fa-plus-circle"></i>
          {saving ? ' Création...' : ' Créer l\'ordre'}
        </button>
      </form>
    </div>
  )
}
