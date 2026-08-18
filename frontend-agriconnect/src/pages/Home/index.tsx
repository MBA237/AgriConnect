import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useSession from '../../hooks/useSession'
import { getProducts, getMyOrders, getCrowdfundingProjects, type Product, type CrowdfundProject } from '../../services/api'
import './Home.css';

export default function Home() {
  const { session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [projects, setProjects] = useState<CrowdfundProject[]>([])
  const isFarmer = session.user?.role === 'agriculteur'

  useEffect(() => {
    let active = true
    const loadProducts = async () => {
      if (!session.token) {
        if (active) {
          setProducts([])
          setLoading(false)
        }
        return
      }

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
    getCrowdfundingProjects().then(response => setProjects(response.data.projects.slice(0, 3))).catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    let active = true
    const loadOrders = async () => {
      if (!session.token) {
        if (active) {
          setOrders([])
          setOrdersLoading(false)
        }
        return
      }

      setOrdersLoading(true)
      try {
        const res = await getMyOrders()
        if (active) setOrders(Array.isArray(res.data.orders) ? res.data.orders : [])
      } catch (err) {
        if (active) setOrders([])
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
  const activeProducts = useMemo(
    () => isFarmer ? products.filter(product => product.ownerId === session.user?.id) : products,
    [isFarmer, products, session.user?.id],
  )
  const currentMonthOrders = useMemo(() => {
    const now = new Date()
    return orders.filter(order => {
      const createdAt = new Date(order.createdAt || '')
      return Number.isFinite(createdAt.getTime()) && createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    })
  }, [orders])
  const ordersInProgress = useMemo(
    () => orders.filter(order => ['pending', 'paid', 'shipped', 'in_transit'].includes(String(order.status || '').toLowerCase())),
    [orders],
  )
  const monthAmount = useMemo(
    () => currentMonthOrders.reduce((total, order) => total + Number(order.totalAmount ?? order.total ?? 0), 0),
    [currentMonthOrders],
  )

  return (
    <section className="dashboard-page">
      <div className="hero-banner" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1400&h=420&fit=crop&q=80')" }}>
        <div className="hero-content">
          <div className="eyebrow">Ferme Agro Dschang · Région Ouest</div>
          <h2>{isFarmer ? `Bonjour, ${session.user?.name ?? 'Jean'}` : 'Bienvenue sur AgriConnect'}</h2>
          <p>{isFarmer ? 'Gérez vos offres, suivez vos ventes et publiez vos nouveaux produits en quelques secondes.' : 'Découvrez les dernières offres publiées et les produits disponibles autour de vous.'}</p>
          <div style={{ marginTop: 18 }}>
            <Link to={isFarmer ? '/offers/new' : '/catalog'} className="btn-primary">{isFarmer ? 'Publier une offre' : 'Explorer le marché'}</Link>
          </div>
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
          <div className="number">{ordersLoading ? '…' : monthAmount.toLocaleString('fr-FR')}</div>
          <div className="label">FCFA acheté ce mois</div>
        </div>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-box"></i></span>
          <div className="number">{ordersLoading ? '…' : ordersInProgress.length}</div>
          <div className="label">Commandes en cours</div>
        </div>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-seedling"></i></span>
          <div className="number">{loading ? '…' : activeProducts.length.toLocaleString('fr-FR')}</div>
          <div className="label">Offres actives</div>
        </div>
        <div className="stat-card">
          <span className="icon"><i className="fas fa-star"></i></span>
          <div className="number">—</div>
          <div className="label">Note moyenne</div>
        </div>
      </div>

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
              <Link className="ticker-item" key={product.id} to={`/products/${product.id}`} aria-label={`Voir les détails de ${product.title}`}>
                <div className="product">
                  <img className="thumb-sm" src={product.images?.[0] ?? 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=120&q=80'} alt={product.title} />
                  {product.title}
                </div>
                <div className="price-info">
                  <span className="current">{product.price.toLocaleString('fr-FR')} FCFA</span>
                  <span className="change up">▲ {product.category}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/catalog" className="qa-item"><span className="icon"><i className="fas fa-chart-line"></i></span><span className="label">Marché</span></Link>
        <Link to="/contracts" className="qa-item"><span className="icon"><i className="fas fa-file-contract"></i></span><span className="label">Contrats</span></Link>
        <Link to="/traceability" className="qa-item"><span className="icon"><i className="fas fa-qrcode"></i></span><span className="label">Traçabilité</span></Link>
        <Link to="/profile" className="qa-item"><span className="icon"><i className="fas fa-file-signature"></i></span><span className="label">Profil</span></Link>
        <Link to={isFarmer ? '/offers/new' : '/catalog'} className="qa-item"><span className="icon"><i className="fas fa-seedling"></i></span><span className="label">{isFarmer ? 'Publier offre' : 'Explorer'}</span></Link>
      </div>

      {projects.length > 0 ? <section className="home-projects">
        <div className="section-title"><i className="fas fa-hand-holding-heart"></i> Projets de financement</div>
        <div className="home-project-grid">
          {projects.map(project => {
            const progress = project.goal > 0 ? Math.min(100, Math.round((project.raised / project.goal) * 100)) : 0

            return (
              <article className="home-project-item" key={project.id}>
                <Link className="home-project-image" to={`/crowdfunding/${project.id}`} aria-label={`Voir le projet ${project.title}`}>
                  {project.image ? (
                    <img src={project.image} alt={project.title} />
                  ) : (
                    <i className="fas fa-seedling" aria-hidden="true"></i>
                  )}
                  <span>{project.status ?? 'En cours'}</span>
                </Link>
                <div className="home-project-content">
                  <div className="home-project-title-row">
                    <Link to={`/crowdfunding/${project.id}`} title={project.title}>{project.title}</Link>
                    <span>{progress}%</span>
                  </div>
                  <div className="home-project-meta">{project.category ?? project.sector ?? 'Projet agricole'} · {project.location ?? 'Cameroun'}</div>
                  <div className="home-project-progress" aria-label={`${progress}% financé`}>
                    <span style={{ width: `${progress}%` }}></span>
                  </div>
                  <div className="home-project-amounts">
                    <strong>{project.raised.toLocaleString('fr-FR')} FCFA</strong>
                    <span>sur {project.goal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <Link className="home-project-invest" to={`/crowdfunding/${project.id}`}>
                    <i className="fas fa-hand-holding-usd" aria-hidden="true"></i> Investir
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section> : null}

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

      {isFarmer ? (
        <Link to="/offers/new" className="btn-secondary" style={{ width: 'auto', marginTop: 8 }}>
          <i className="fas fa-plus-circle"></i> Publier une offre
        </Link>
      ) : null}
    </section>
  )
}
