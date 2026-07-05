import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProduct, deleteProduct, type Product } from '../services/api'
import useSession from '../hooks/useSession'
import useCart from '../hooks/useCart'
import { useToasts } from '../components/ToastProvider'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    const run = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await getProduct(id)
        setProduct(res.data.product ?? null)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const { addToCart } = useCart()
  const toasts = useToasts()
  const isOwner = session.user?.id === product?.ownerId

  const handleDelete = async () => {
    if (!product || !window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return
    
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      toasts.push({ type: 'success', title: 'Succès', message: 'Offre supprimée avec succès.' })
      navigate('/catalog')
    } catch (err) {
      toasts.push({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer l\'offre.' })
    } finally {
      setDeleting(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      unit: product.unit,
      quantity,
      image: product.images?.[0] ?? 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
      farmerName: product.farmerName,
    })
    toasts.push({ type: 'success', title: 'Ajouté au panier', message: `${quantity} ${product.unit} de ${product.title} ajouté au panier.` })
  }

  if (loading) return <div className="card">Chargement...</div>
  if (!product) return <div className="card">Produit introuvable</div>

  const images = product.images ?? ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80']

  return (
    <section className="page">
      <Link className="btn-small btn-small-outline" to="/catalog" style={{ marginBottom: 16 }}>
        <i className="fas fa-arrow-left"></i> Retour au catalogue
      </Link>

      <div className="product-detail-grid">
        <div className="card product-hero-card">
          <img 
            className="product-detail-image" 
            src={images[selectedImageIndex]} 
            alt={product.title} 
          />
          {images.length > 1 && (
            <div className="product-detail-gallery">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`gallery-thumb ${selectedImageIndex === idx ? 'active' : ''}`}
                  style={{ cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}
                >
                  <img src={img} alt={`${product.title}-${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="product-badge" style={{ width: 'fit-content' }}>{product.category}</div>
            {isOwner && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link className="btn-small btn-small-outline" to={`/offers/edit/${product.id}`}>
                  <i className="fas fa-edit"></i> Modifier
                </Link>
                <button 
                  className="btn-small btn-small-danger" 
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <i className="fas fa-trash"></i> {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)' }}>{product.title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{product.description}</p>

          <div className="product-price" style={{ fontSize: 24 }}>{product.price.toLocaleString('fr-FR')} FCFA / {product.unit}</div>

          <div className="detail-list">
            <div><strong>Localisation:</strong> {product.location}</div>
            <div><strong>Disponibilité:</strong> {product.stock} unités</div>
            <div><strong>Qualité:</strong> {product.quality}</div>
            <div><strong>Livraison:</strong> {product.deliveryTime}</div>
            <div><strong>Vendeur:</strong> {product.farmerName}</div>
            {product.publishedAt && (
              <div><strong>Publié le:</strong> {new Date(product.publishedAt).toLocaleDateString('fr-FR')}</div>
            )}
          </div>

          {!isOwner && (
            <>
              <div className="input-group">
                <label>Quantité</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="btn-small btn-small-outline"
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max={product.stock}
                    style={{ width: 60, textAlign: 'center' }}
                  />
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="btn-small btn-small-outline"
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={handleAddToCart}>
                  <i className="fas fa-shopping-cart"></i> Ajouter au panier ({quantity} {product.unit})
                </button>
                <button className="btn-outline">
                  <i className="fas fa-phone"></i> Contacter le vendeur
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
