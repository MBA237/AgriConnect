import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSession from '../hooks/useSession'
import { getProducts, getMarketStats, type Product } from '../services/api'

export default function ProductCatalog() {
  const { session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [distance, setDistance] = useState('10km')

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const res = await getProducts({ search, category, sort })
        setProducts(res.data.products ?? [])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [search, category, sort])

  const categories = useMemo(() => ['all', 'Céréales', 'Légumes', 'Fruits', 'Tubercules', 'Élevage'], [])
  const isFarmer = session.user?.role === 'agriculteur'
  const [stats, setStats] = useState<{ offers?: number; rating?: number; avgDelivery?: string; monthlyRevenue?: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadStats = async () => {
      setStatsLoading(true)
      setStatsError(null)
      try {
        const res = await getMarketStats()
        if (active) setStats(res.data ?? null)
      } catch (err: any) {
        console.error('Erreur chargement stats marché:', err)
        if (active) setStatsError('Impossible de charger les statistiques du marché')
      } finally {
        if (active) setStatsLoading(false)
      }
    }

    loadStats()
    return () => {
      active = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase()
    return products.filter(product => {
      const matchesOwner = !isFarmer || product.ownerId === session.user?.id || product.farmerName === session.user?.name
      const matchesSearch = !term || product.title.toLowerCase().includes(term) || product.description.toLowerCase().includes(term)
      const matchesCategory = category === 'all' || product.category === category
      return matchesOwner && matchesSearch && matchesCategory
    })
  }, [products, search, category, isFarmer, session.user?.id, session.user?.name])

  return (
    <section className="page catalog-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-store" style={{ color: 'var(--primary)' }}></i> {isFarmer ? 'Mes produits' : 'Catalogue'}</h1>
          <div className="sub">{isFarmer ? 'Vos offres publiées, triées du plus récent au plus ancien' : 'Produits frais disponibles dans votre région'}</div>
        </div>
        <div className="actions">
          {isFarmer ? (
            <Link className="btn-small btn-small-success" to="/offers/new">Publier une offre</Link>
          ) : (
            <span className="badge">Disponibilité temps réel</span>
          )}
        </div>
      </div>

      <div className="catalog-hero card">
        <div className="catalog-hero-copy">
          <div className="eyebrow">Marché local · Traçabilité</div>
          <h2>Découvrez les produits frais les plus proches de vous</h2>
          <p>Des offres vérifiées, des prix transparents et une expérience d’achat pensée pour les acteurs agricoles et les acheteurs locaux.</p>
        </div>
        {statsError && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <div className="alert-body">
              <div className="alert-title">API indisponible</div>
              <div className="alert-message">Impossible de charger les statistiques du marché. Les valeurs peuvent être limitées.</div>
            </div>
          </div>
        )}

        <div className="catalog-hero-stats">
          <div>
            <strong>{statsLoading ? '…' : ((stats?.offers ?? 0) > 0 ? `+${stats?.offers}` : '0')}</strong>
            <span>Offres actives</span>
          </div>
          <div>
            <strong>{statsLoading ? '…' : `${Number(stats?.rating ?? 1.1).toFixed(1)}/5`}</strong>
            <span>Note moyenne</span>
          </div>
          <div>
            <strong>{statsLoading ? '…' : stats?.avgDelivery ?? '—'}</strong>
            <span>Livraison rapide</span>
          </div>
        </div>
      </div>

      <div className="card catalog-shell">
        <div className="catalog-toolbar">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Rechercher un produit</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ex. tomates, piment..." />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(item => (
                <option key={item} value={item === 'all' ? 'all' : item}>{item === 'all' ? 'Toutes' : item}</option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Trier par</label>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="newest">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        <div className="filter-row" style={{ marginTop: 10 }}>
          {["5 km", "10 km", "20 km"].map(item => (
            <button key={item} className={`filter-btn${distance === item ? ' active' : ''}`} onClick={() => setDistance(item)}>{item}</button>
          ))}
          <button className="filter-btn"><i className="fas fa-sort"></i> Trier</button>
        </div>

        <div className="category-grid" style={{ marginTop: 14 }}>
          {[
            { key: 'Légumes', emoji: '🥬' },
            { key: 'Fruits', emoji: '🍎' },
            { key: 'Céréales', emoji: '🌾' },
            { key: 'Tubercules', emoji: '🥔' },
          ].map(cat => (
            <button
              key={cat.key}
              type="button"
              className={`cat-item${category === cat.key ? ' active' : ''}`}
              onClick={() => setCategory(cat.key)}
            >
              <span className="emoji">{cat.emoji}</span>
              {cat.key}
            </button>
          ))}
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 16 }}><i className="fas fa-store-alt"></i> {isFarmer ? 'Vos offres publiées' : 'Produits à proximité'}</div>

      {loading ? (
        <div className="card">Chargement des offres...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ marginBottom: 12 }}>Aucune offre ne correspond à votre recherche pour le moment.</p>
          {isFarmer && <Link className="btn-primary" to="/offers/new">Publier votre première offre</Link>}
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <article className="product-card product-card-compact" key={product.id}>
              <div className="product-card-image">
                <img src={product.images?.[0] ?? 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'} alt={product.title} />
                <span className="product-badge">{product.category}</span>
                <div className="product-float-pill"><i className="fas fa-bolt"></i> En direct</div>
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
                  <span><i className="fas fa-user"></i> {product.farmerName}</span>
                  <span className="star">⭐ 4.8</span>
                  <span><i className="fas fa-map-marker-alt"></i> {distance}</span>
                </div>

                <div className="catalog-badges">
                  <span className="badge-blockchain"><i className="fas fa-link"></i> Traçable</span>
                  <span className="badge-ia">+5.2%</span>
                </div>

                <div className="product-card-footer">
                  <span className="product-author">{product.stock} disponibles</span>
                  <Link className="btn-small btn-small-outline" to={`/products/${product.id}`}>
                    Voir l'offre
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
