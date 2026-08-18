import React, { useState } from 'react'
import { getPriceForZone, type PriceData } from '../services/api'
import './PriceDisplay.css'

type PriceDisplayProps = {
  prices: PriceData[]
  onSelectProduct: (productId: string) => void
  selectedZone?: string
}

export default function PriceDisplay({ prices, onSelectProduct, selectedZone = 'national' }: PriceDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredPrices = selectedCategory === 'all' 
    ? prices 
    : prices.filter(p => p.category === selectedCategory)

  const categories = ['all', ...new Set(prices.map(p => p.category))]

  return (
    <div className="price-display">
      <div className="price-filter" aria-label="Filtrer par catégorie">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Tous' : cat}
          </button>
        ))}
      </div>

      <div className="price-grid">
        {filteredPrices.length === 0 ? (
          <div className="price-empty">
            <i className="fas fa-filter" aria-hidden="true"></i>
            <span>Aucun produit dans cette catégorie.</span>
          </div>
        ) : filteredPrices.map(price => (
          <div
            key={price.productId}
            className="price-card card"
            onClick={() => onSelectProduct(price.productId)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectProduct(price.productId)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Afficher les données de ${price.productTitle}`}
          >
            <div className="price-header">
              <h3 title={price.productTitle}>{price.productTitle}</h3>
              <span className="category-badge" title={price.category}>{price.category}</span>
            </div>

            <div className="price-display-main">
              {(() => {
                const regionalPrice = getPriceForZone(price, selectedZone)
                return <>
              <div className="current-price">
                <span className="label">Prix {selectedZone === 'national' ? 'national' : selectedZone}</span>
                <span className="value">{regionalPrice.price.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className={`price-change ${regionalPrice.trend}`}>
                <i className={`fas fa-arrow-${regionalPrice.trend === 'up' ? 'up' : regionalPrice.trend === 'down' ? 'down' : 'right'}`}></i>
                <span>{regionalPrice.change > 0 ? '+' : ''}{regionalPrice.change.toFixed(2)}%</span>
              </div>
                </>
              })()}
            </div>

            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Évolution</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: price.priceChangePercent >= 0 ? 'var(--danger)' : 'var(--success)',
                  background: price.priceChangePercent >= 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                {price.priceChangePercent > 0 ? '+' : ''}{price.priceChangePercent.toFixed(1)}%
              </span>
            </div>

            <div className="price-meta">
              <div>
                <span className="label">Précédent</span>
                <span>{price.previousPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div>
                <span className="label">Unité</span>
                <span>{price.unit}</span>
              </div>
            </div>

            <div className="price-timestamp">
              <i className="fas fa-clock"></i>
              {new Date(price.timestamp).toLocaleTimeString('fr-FR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
