import { getPriceForZone, type PriceData } from '../services/api'
import './PriceDisplay.css'

type PriceDisplayProps = {
  prices: PriceData[]
  onSelectProduct: (productId: string) => void
}

export default function PriceDisplay({ prices, onSelectProduct }: PriceDisplayProps) {
  return (
    <div className="price-display">
      <div className="price-grid">
        {prices.length === 0 ? (
          <div className="price-empty">
            <i className="fas fa-filter" aria-hidden="true"></i>
            <span>Aucun produit dans cette catégorie.</span>
          </div>
        ) : prices.map(price => {
          const nationalPrice = getPriceForZone(price, 'national')

          return (
            <div
              key={price.productId}
              className={`price-card card ${price.available === false ? 'offline-card' : ''}`}
              onClick={() => {
                onSelectProduct(price.productId)
              }}
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
              {price.imageUrl && <img className="price-product-image" src={price.imageUrl} alt={price.productTitle} loading="lazy" />}
              <div className="price-header">
                <h3 title={price.productTitle}>{price.productTitle}</h3>
                <span className="category-badge" title={price.category}>{price.category}</span>
              </div>

              <div className="price-display-main">
                <div className="current-price">
                  <span className="value">{price.available === false ? 'Indisponible' : `${nationalPrice.price.toLocaleString('fr-FR')} FCFA / ${price.unit}`}</span>
                </div>
                <div className={`price-change ${price.available === false ? 'stable' : nationalPrice.trend}`}>
                  <i className={`fas fa-arrow-${price.available === false ? 'right' : nationalPrice.trend === 'up' ? 'up' : nationalPrice.trend === 'down' ? 'down' : 'right'}`}></i>
                  <span>{price.available === false ? 'En attente' : `${nationalPrice.change > 0 ? '+' : ''}${nationalPrice.change.toFixed(2)}%`}</span>
                </div>
              </div>

              <div className="price-meta">
                <div>
                  <span className="label">Unité</span>
                  <span>{price.unit}</span>
                </div>
              </div>

              <div className="price-timestamp">
                <i className="fas fa-clock"></i>
                {price.available === false ? 'Prix marketplace indisponible' : new Date(price.timestamp).toLocaleTimeString('fr-FR')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
