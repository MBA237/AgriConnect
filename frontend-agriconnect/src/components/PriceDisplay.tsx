import React, { useState } from 'react'
import type { PriceData } from '../services/api'

type PriceDisplayProps = {
  prices: PriceData[]
  onSelectProduct: (productId: string) => void
}

export default function PriceDisplay({ prices, onSelectProduct }: PriceDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredPrices = selectedCategory === 'all' 
    ? prices 
    : prices.filter(p => p.category === selectedCategory)

  const categories = ['all', ...new Set(prices.map(p => p.category))]

  return (
    <div className="price-display">
      <div className="price-filter" style={{ marginBottom: 16 }}>
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
        {filteredPrices.map(price => (
          <div
            key={price.productId}
            className="price-card card"
            onClick={() => onSelectProduct(price.productId)}
            style={{ cursor: 'pointer' }}
          >
            <div className="price-header">
              <h3>{price.productTitle}</h3>
              <span className="category-badge">{price.category}</span>
            </div>

            <div className="price-display-main">
              <div className="current-price">
                <span className="label">Prix actuel</span>
                <span className="value">{price.currentPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className={`price-change ${price.trend}`}>
                <i className={`fas fa-arrow-${price.trend === 'up' ? 'up' : 'down'}`}></i>
                <span>{Math.abs(price.priceChange)} FCFA</span>
                <span className="percent">({price.priceChangePercent > 0 ? '+' : ''}{price.priceChangePercent.toFixed(2)}%)</span>
              </div>
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
