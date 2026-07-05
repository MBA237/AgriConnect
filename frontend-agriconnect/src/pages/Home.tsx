import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSession from '../hooks/useSession'
import { getProducts, getMyOrders, getMarketStats, type Product } from '../services/api'

export default function Home() {
  const { session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [stats, setStats] = useState<{ offers?: number; rating?: number; avgDelivery?: string; monthlyRevenue?: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const isFarmer = session.user?.role === 'agriculteur'

  useEffect(() => {
    let active = true
    const loadProducts = async () => {
      setLoading(true)
      try {
        const res = await getProducts({ sort: 'newest' })
        if (active) setProducts(res.data.products ?? [])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProducts()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadStats = async () => {
      setStatsLoading(true)
      setStatsError(null)
      try {
        const res = await getMarketStats()
        if (active) setStats(res.data ?? null)
      } catch (err) {
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

  useEffect(() => {
    let active = true
    const loadOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await getMyOrders()
        if (active) setOrders(Array.isArray(res.data.orders) ? res.data.orders : [])
      } catch (err) {
        console.error('Erreur chargement commandes:', err)
      } finally {
        if (active) setOrdersLoading(false)
      }
    }

    loadOrders()
    return () => {
      active = false
    }
  }, [])

  const latestProducts = useMemo(() => products.slice(0, 4), [products])

  return (
    <section className="dashboard-page">
      <div className="hero-banner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1400&h=420&fit=crop&q=80')" }}>
        <div className="hero-content">
          <div className="eyebrow">Ferme Agro Dschang · Région Ouest</div>
          <h2>{isFarmer ? `Bonjour, ${session.user?.name ?? 'Jean'}` : 'Bienvenue sur AgriConnect'}</h2>
          <p>{isFarmer ? 'Gérez vos offres, suivez vos ventes et publiez vos nouveaux produits en quelques secondes.' : 'Découvrez les dernières offres publiées et les produits disponibles autour de vous.'}</p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 18 }}>
        <div className="action-tags">
          <span className={`badge-${isFarmer ? 'farmer' : 'blockchain'}`}><i className={`fas ${isFarmer ? 'fa-tractor' : 'fa-users'}`}></i> {isFarmer ? 'Agriculteur' : 'Acheteur'}</span>
          <span className="badge-blockchain"><i className="fas fa-link"></i> Blockchain</span>
          <span className="badge-premium"><i className="fas fa-crown"></i> Premium</span>
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: 18 }}>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-coins"></i></span>
          <div className="number">{statsLoading ? '…' : stats?.monthlyRevenue ? Number(stats.monthlyRevenue).toLocaleString('fr-FR') : '0'}</div>
          <div className="label">FCFA ce mois</div>
        </div>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-box"></i></span>
          <div className="number">{ordersLoading ? '…' : (orders.length ?? 0)}</div>
          <div className="label">Commandes en cours</div>
        </div>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-seedling"></i></span>
          <div className="number">{statsLoading ? '…' : (stats?.offers ?? 0).toLocaleString('fr-FR')}</div>
          <div className="label">Offres actives</div>
        </div>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-star"></i></span>
          <div className="number">{statsLoading ? '…' : Number(stats?.rating ?? 1.1).toFixed(1)}</div>
          <div className="label">Note moyenne</div>
        </div>
      </div>

      {statsError && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          <div className="alert-body">
            <div className="alert-title">API indisponible</div>
            <div className="alert-message">Impossible de charger les statistiques du marché. Certaines données peuvent être incomplètes.</div>
          </div>
        </div>
      )}

      <div className="price-ticker">
        <div className="ticker-header">
          <span><i className="fas fa-bolt" style={{ color: 'var(--secondary)' }}></i> Dernières offres publiées</span>
          <span>🟢 Triées du plus récent</span>
        </div>
        {loading ? (
          <div className="card" style={{ marginTop: 10 }}>Chargement des offres…</div>
        ) : (
          <div className="ticker-grid">
            {latestProducts.map(product => (
              <div className="ticker-item" key={product.id}>
                <div className="product">
                  <img className="thumb-sm" src={product.images?.[0] ?? 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=120&q=80'} alt={product.title} />
                  {product.title}
                </div>
                <div className="price-info">
                  <span className="current">{product.price.toLocaleString('fr-FR')} FCFA</span>
                  <span className="change up">▲ {product.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/catalog" className="qa-item"><span className="icon"><i className="fas fa-chart-line"></i></span><span className="label">Marché</span></Link>
        <Link to="/profile" className="qa-item"><span className="icon"><i className="fas fa-file-signature"></i></span><span className="label">Profil</span></Link>
        <Link to={isFarmer ? '/offers/new' : '/catalog'} className="qa-item"><span className="icon"><i className="fas fa-seedling"></i></span><span className="label">{isFarmer ? 'Publier offre' : 'Explorer'}</span></Link>
        <div className="qa-item"><span className="icon"><i className="fas fa-qrcode"></i></span><span className="label">Traçabilité</span></div>
      </div>

      <div className="section-title"><i className="fas fa-file-contract"></i> Contrats actifs</div>
      {ordersLoading ? (
        <div className="card" style={{ padding: 18 }}>Chargement des commandes...</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: 18 }}>
          <p>Aucune commande récente trouvée.</p>
        </div>
      ) : (
        orders.map(order => (
          <div className="card order-card" key={order.id}>
            <div className="order-card-top">
              <span>Réf. {order.id}</span>
              <span className={`badge-${order.status === 'pending' ? 'warning' : order.status === 'success' ? 'success' : 'danger'}`}>
                {order.status}
              </span>
            </div>
            <div className="order-details">{order.items?.length ?? 0} articles · {order.total?.toLocaleString('fr-FR') ?? 0} FCFA</div>
            <Link className="btn-small btn-small-outline" to={`/orders/${order.id}`}>
              <i className="fas fa-eye"></i> Voir
            </Link>
          </div>
        ))
      )}

      <button className="btn-secondary" style={{ width: 'auto', marginTop: 8 }}><i className="fas fa-plus-circle"></i> Publier une offre</button>
    </section>
  )
}
