import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProduct, deleteProduct, type Product } from '../../services/api'
import useSession from '../../hooks/useSession'
import useCart from '../../hooks/useCart'
import { useToasts } from '../../components/ToastProvider'
import './ProductDetail.css';

const fallbackProductImage = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [descriptionIsOverflowing, setDescriptionIsOverflowing] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const [showAllDetails, setShowAllDetails] = useState(false)

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

  useEffect(() => {
    const descriptionElement = descriptionRef.current
    if (!descriptionElement) return

    const measureDescription = () => {
      if (!showFullDescription) {
        setDescriptionIsOverflowing(descriptionElement.scrollHeight > descriptionElement.clientHeight)
      }
    }

    measureDescription()
    const observer = new ResizeObserver(measureDescription)
    observer.observe(descriptionElement)
    return () => observer.disconnect()
  }, [product?.description, showFullDescription])

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
      image: product.images?.[0] ?? fallbackProductImage,
      farmerName: product.farmerName,
    })
    toasts.push({ type: 'success', title: 'Ajouté au panier', message: `${quantity} ${product.unit} de ${product.title} ajouté au panier.` })
  }

  if (loading) return <div className="card">Chargement...</div>
  if (!product) return <div className="card">Produit introuvable</div>

  const images = product.images?.filter(Boolean) ?? []
  const selectedImage = imageError ? fallbackProductImage : (images[selectedImageIndex] ?? fallbackProductImage)

  return (
    <section className="page product-detail-page">
      <Link className="btn-small btn-small-outline" to="/catalog" style={{ marginBottom: 16 }}>
        <i className="fas fa-arrow-left"></i> Retour au catalogue
      </Link>

      <div className="product-detail-grid">
        <div className="card product-hero-card">
          <div className="product-image-frame">
          <img 
            className="product-detail-image" 
            src={selectedImage}
            alt={product.title} 
            onError={() => setImageError(true)}
          />
          {imageError && <span className="product-image-status">Aperçu disponible</span>}
          </div>
          {images.length > 1 && !imageError && (
            <div className="product-detail-gallery">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`gallery-thumb ${selectedImageIndex === idx ? 'active' : ''}`}
                  style={{ cursor: 'pointer', border: 'none', padding: 0, background: 'none' }}
                >
                  <img src={img} alt={`${product.title} - image ${idx + 1}`} onError={event => { event.currentTarget.style.visibility = 'hidden' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card product-detail-summary">
          <div className="product-detail-topline">
            <div className="product-badge product-detail-category">{product.category || 'Produit agricole'}</div>
            {isOwner && (
              <div className="product-owner-actions">
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

          <div className="product-detail-heading">
            <span className="product-detail-eyebrow">Offre agricole</span>
            <h1>{product.title}</h1>
          </div>
          <div className={`product-description-block${showFullDescription ? ' expanded' : ''}`}>
            <p ref={descriptionRef} className="product-description">
              {product.description || 'Aucune description disponible pour cette offre.'}
            </p>
            {(descriptionIsOverflowing || showFullDescription) && (
              <button
                type="button"
                className="detail-toggle"
                aria-expanded={showFullDescription}
                onClick={() => setShowFullDescription(value => !value)}
              >
                {showFullDescription ? 'Réduire' : 'Voir plus'}
                <i className={`fas fa-chevron-${showFullDescription ? 'up' : 'down'}`} aria-hidden="true"></i>
              </button>
            )}
          </div>

          <div className="product-detail-price-box">
            <span className="product-detail-price-label">Prix proposé</span>
            <div className="product-price product-detail-price">{product.price.toLocaleString('fr-FR')} FCFA <small>/ {product.unit}</small></div>
          </div>

          <div className={`detail-list${showAllDetails ? ' expanded' : ''}`}>
            <div><strong>Localisation:</strong> {product.location || 'Non renseignée'}</div>
            <div><strong>Disponibilité:</strong> {product.stock} unités</div>
            <div><strong>Qualité:</strong> {product.quality || 'Standard'}</div>
            <div><strong>Livraison:</strong> {product.deliveryTime || 'À définir'}</div>
            <div className="detail-secondary"><strong>Vendeur:</strong> {product.farmerName || 'Vendeur enregistré'}</div>
            {product.publishedAt && (
              <div className="detail-secondary"><strong>Publié le:</strong> {new Date(product.publishedAt).toLocaleDateString('fr-FR')}</div>
            )}
          </div>
          <button
            type="button"
            className="detail-toggle detail-list-toggle"
            aria-expanded={showAllDetails}
            onClick={() => setShowAllDetails(value => !value)}
          >
            {showAllDetails ? 'Masquer les détails' : 'Afficher tous les détails'}
            <i className={`fas fa-chevron-${showAllDetails ? 'up' : 'down'}`} aria-hidden="true"></i>
          </button>

          {!isOwner && (
            <>
              <div className="input-group">
                <label>Quantité</label>
                <div className="product-quantity-control">
                  <button type="button"
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
                  />
                  <button type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="btn-small btn-small-outline"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-detail-actions">
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
