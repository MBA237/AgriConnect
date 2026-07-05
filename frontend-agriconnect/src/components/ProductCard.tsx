import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../services/api'

type ProductCardProps = {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card-image">
        <img src={product.images?.[0] ?? 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'} alt={product.title} />
        <span className="product-badge">{product.category}</span>
      </div>

      <div className="product-card-body">
        <div className="product-card-head">
          <div>
            <h3>{product.title}</h3>
            <p className="product-location">{product.location}</p>
          </div>
          <div className="product-price">{product.price.toLocaleString('fr-FR')} FCFA</div>
        </div>

        <p className="product-description">{product.description}</p>

        <div className="product-meta">
          <span>{product.stock} disponibles</span>
          <span>{product.deliveryTime}</span>
        </div>

        <div className="product-card-footer">
          <span className="product-author">Par {product.farmerName}</span>
          <Link className="btn-small btn-small-outline" to={`/products/${product.id}`}>
            Voir l'offre
          </Link>
        </div>
      </div>
    </article>
  )
}
