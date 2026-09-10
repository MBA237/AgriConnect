import React, { useEffect, useMemo, useState } from 'react'
import PredictiveChat from '../../components/PredictiveChat'
import { getMarketPrices, getPriceForZone, type PriceData } from '../../services/api'
import { useToasts } from '../../components/ToastProvider'
import { findCatalogProduct, MARKET_CATALOG, MARKET_PRODUCT_LOCATIONS } from './marketCatalog'
import './MarketDynamic.css';

function buildCatalogPrices(remotePrices: PriceData[]) {
  return MARKET_CATALOG.map(product => {
    const remote = remotePrices.find(price => findCatalogProduct(price.productTitle)?.id === product.id)
    return remote
      ? { ...remote, productId: product.id, productTitle: product.name, category: remote.category || product.category, imageUrl: product.imageUrl, available: true }
      : {
          productId: product.id,
          productTitle: product.name,
          category: product.category,
          currentPrice: 0,
          previousPrice: 0,
          priceChange: 0,
          priceChangePercent: 0,
          unit: 'kg',
          timestamp: new Date().toISOString(),
          trend: 'stable' as const,
          aiInsight: 'Prix en attente de la marketplace.',
          imageUrl: product.imageUrl,
          available: false,
        }
  })
}

export default function MarketDynamic() {
  const toasts = useToasts()
  const [prices, setPrices] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [marketNotice, setMarketNotice] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'disabled'>('connecting')

  // Charger les prix initialement
  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true)
      try {
        const pricesResult = await Promise.allSettled([getMarketPrices()]).then(([result]) => result)

        let remotePrices: PriceData[] = []

        if (pricesResult.status === 'fulfilled') {
          remotePrices = Array.isArray(pricesResult.value.data.prices) ? pricesResult.value.data.prices : []
        }

        const incomingPrices = buildCatalogPrices(remotePrices)

        setPrices(incomingPrices)
        setMarketNotice(
          pricesResult.status === 'fulfilled'
            ? pricesResult.value.data.meta?.message ?? null
            : 'La marketplace est indisponible. Les produits AgriConnect restent visibles.'
        )

      } finally {
        setLoading(false)
      }
    }
    loadPrices()
  }, [toasts])

  useEffect(() => {
    setSelectedProductId(current => {
      if (current && prices.some(price => price.productId === current)) return current
      return prices[0]?.productId ?? null
    })
  }, [prices])

  // WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const configuredWsUrl = import.meta.env.VITE_WS_URL?.trim()
    const apiUrl = import.meta.env.VITE_API_BASE_URL?.trim()
    const wsOrigin = apiUrl
      ? apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    const wsUrl = configuredWsUrl
      ? configuredWsUrl.replace(/\/$/, '').endsWith('/market/price-update')
        ? configuredWsUrl
        : `${configuredWsUrl.replace(/\/$/, '')}/market/price-update`
      : `${wsOrigin}/market/price-update`
    let websocket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let pollTimer: number | null = null
    let shouldReconnect = true

    const startPolling = () => {
      if (!pollTimer) pollTimer = window.setInterval(refreshPrices, 10000)
    }

    const stopPolling = () => {
      if (pollTimer) {
        window.clearInterval(pollTimer)
        pollTimer = null
      }
    }

    const refreshPrices = async () => {
      try {
        const res = await getMarketPrices()
        setPrices(buildCatalogPrices(Array.isArray(res.data.prices) ? res.data.prices : []))
        setMarketNotice(res.data.meta?.message ?? null)
      } catch (err) {
        console.error('Erreur lors du rafraîchissement des prix:', err)
      }
    }

    const connectWebSocket = () => {
      setWsStatus('connecting')

      try {
        websocket = new WebSocket(wsUrl)

        websocket.onopen = () => {
          stopPolling()
          setWsStatus('connected')
        }

        websocket.onopen = () => {
          stopPolling()
          setWsStatus('connected')
          if (prices.length > 0) {
            setMarketNotice('Marché en ligne : prix synchronisés en temps réel.')
          }
        }

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'PRICE_UPDATE' || data.type === 'price_update') {
              setPrices(prevPrices =>
                prevPrices.map(p =>
                  p.productId === data.productId
                    ? {
                        ...p,
                        previousPrice: p.currentPrice,
                        currentPrice: Number(data.priceData?.currentPrice ?? data.price ?? p.currentPrice),
                        priceChange: Number(data.priceData?.priceChange ?? data.price ?? p.currentPrice) - p.currentPrice,
                        priceChangePercent: p.currentPrice > 0
                          ? ((Number(data.priceData?.currentPrice ?? data.price ?? p.currentPrice) - p.currentPrice) / p.currentPrice) * 100
                          : 0,
                        timestamp: data.timestamp || new Date().toISOString(),
                      }
                    : p
                )
              )
            }
          } catch (err) {
            console.error('Erreur parsing WebSocket:', err)
          }
        }

        websocket.onerror = () => {
          // The close handler owns reconnection; this event is only a transient signal.
          startPolling()
          setWsStatus('closed')
        }

        websocket.onclose = () => {
          setWsStatus('closed')
          startPolling()
          if (shouldReconnect && !reconnectTimer) {
            reconnectTimer = window.setTimeout(() => {
              reconnectTimer = null
              connectWebSocket()
            }, 3000)
          }
        }
      } catch (err) {
        setWsStatus('closed')
        startPolling()
        if (shouldReconnect && !reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null
            connectWebSocket()
          }, 3000)
        }
      }
    }

    connectWebSocket()

    return () => {
      shouldReconnect = false
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }
      if (pollTimer) {
        window.clearInterval(pollTimer)
      }
      if (websocket) {
        websocket.close()
      }
    }
  }, [])

  const handleRefreshPrices = async () => {
    try {
      const res = await getMarketPrices()
      setPrices(buildCatalogPrices(Array.isArray(res.data.prices) ? res.data.prices : []))
      setMarketNotice(res.data.meta?.message ?? null)
      toasts.push({ type: 'success', title: 'Succès', message: 'Prix mis à jour.' })
    } catch (err) {
      setMarketNotice('Le service de marché est temporairement indisponible. Les données affichées sont limitées.')
    }
  }

  const productTypes = useMemo(() => ['all', ...new Set(MARKET_CATALOG.map(product => product.category))], [])
  const regions = useMemo(() => ['all', ...new Set(Object.values(MARKET_PRODUCT_LOCATIONS).flatMap(location => location.regions))], [])
  const cities = useMemo(() => ['all', ...new Set(Object.values(MARKET_PRODUCT_LOCATIONS).flatMap(location => location.cities))], [])

  const filteredPrices = prices.filter(price => {
    const location = MARKET_PRODUCT_LOCATIONS[price.productId]
    const query = appliedSearch.trim().toLocaleLowerCase('fr-FR')
    const matchesSearch = !query || `${price.productTitle} ${price.category}`.toLocaleLowerCase('fr-FR').includes(query)
    const matchesType = selectedType === 'all' || price.category === selectedType
    const matchesRegion = selectedRegion === 'all' || location?.regions.includes(selectedRegion)
    const matchesCity = selectedCity === 'all' || location?.cities.includes(selectedCity)
    return matchesSearch && matchesType && matchesRegion && matchesCity
  })
  const selectedProduct = prices.find(price => price.productId === selectedProductId)

  return (
    <section className="page market-page">
      <div className="page-header market-header">
        <div>
          <h1><i className="fas fa-chart-line" style={{ color: 'var(--primary)' }}></i> Marché Dynamique</h1>
          <div className="sub">Consultez les prix en direct du marché</div>
        </div>
        <div className="actions market-header-actions">
          <span className="market-connection-status">
            <i className={`fas fa-circle ${wsStatus === 'connected' ? 'live' : 'offline'}`}></i>
            {wsStatus === 'connected' ? 'En direct' : wsStatus === 'connecting' ? 'Connexion...' : wsStatus === 'disabled' ? 'WebSocket désactivé' : 'Hors ligne'}
          </span>
          <button className="btn-small btn-small-outline" onClick={handleRefreshPrices} type="button">
            <i className="fas fa-sync-alt"></i> Rafraîchir
          </button>
        </div>
      </div>

      {marketNotice && (
        <div className="market-notice card">
          <div className="market-notice-content">
            <i className="fas fa-info-circle" style={{ color: '#f59e0b' }}></i>
            <span>{marketNotice}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="market-empty card" role="status">Chargement des prix...</div>
      ) : prices.length === 0 ? (
        <div className="market-empty card">
          <i className="fas fa-chart-line" aria-hidden="true"></i>
          <h2>Marché momentanément indisponible</h2>
          <p>Nous ne recevons pas encore de cotations. Réessayez dans quelques instants.</p>
          <button className="btn-primary" type="button" onClick={handleRefreshPrices}>Réessayer</button>
        </div>
      ) : (
        <div className="market-grid">
          <div className="market-right">
            <div className="market-national-card card">
              <div className="market-section-heading">
                <div>
                  <span className="market-kicker">Cotation nationale</span>
                  <h2><i className="fas fa-seedling"></i> Produits du marché</h2>
                </div>
                <span className="market-section-note">Prix observés à l'échelle du Cameroun</span>
              </div>

              <form
                className="market-search"
                onSubmit={event => {
                  event.preventDefault()
                  setAppliedSearch(searchTerm)
                }}
              >
                <label htmlFor="market-product-search">Rechercher un produit</label>
                <div className="market-search-controls">
                  <input
                    id="market-product-search"
                    type="search"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Ex. maïs, tomate, cacao"
                  />
                  <button className="btn-primary" type="submit">
                    <i className="fas fa-search" aria-hidden="true"></i>
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="market-filters" aria-label="Filtrer les produits par type, région et ville">
                <label>
                  Type de produit
                  <select value={selectedType} onChange={event => setSelectedType(event.target.value)}>
                    {productTypes.map(type => <option key={type} value={type}>{type === 'all' ? 'Tous les types' : type}</option>)}
                  </select>
                </label>
                <label>
                  Région
                  <select value={selectedRegion} onChange={event => setSelectedRegion(event.target.value)}>
                    {regions.map(region => <option key={region} value={region}>{region === 'all' ? 'Toutes les régions' : region}</option>)}
                  </select>
                </label>
                <label>
                  Ville
                  <select value={selectedCity} onChange={event => setSelectedCity(event.target.value)}>
                    {cities.map(city => <option key={city} value={city}>{city === 'all' ? 'Toutes les villes' : city}</option>)}
                  </select>
                </label>
                <button
                  className="btn-small btn-small-outline market-filter-reset"
                  type="button"
                  onClick={() => {
                    setSelectedType('all')
                    setSelectedRegion('all')
                    setSelectedCity('all')
                    setSearchTerm('')
                    setAppliedSearch('')
                  }}
                >
                  Réinitialiser
                </button>
              </div>

              <div className="market-product-grid">
                {filteredPrices.map(price => {
                  const isSelected = selectedProductId === price.productId
                  const nationalPrice = getPriceForZone(price, 'national')

                  return (
                    <button
                      key={price.productId}
                      onClick={() => {
                        setSelectedProductId(price.productId)
                        setShowAiAnalysis(true)
                      }}
                      style={{
                        textAlign: 'left',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                        borderRadius: 12,
                        padding: 14,
                        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                        cursor: 'pointer',
                      }}
                    >
                      <img src={price.imageUrl} alt={price.productTitle} loading="lazy" style={{ width: '100%', height: 132, borderRadius: 10, objectFit: 'cover', marginBottom: 12 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong className="market-product-title">{price.productTitle}</strong>
                        <span className="badge success">{price.category}</span>
                      </div>
                      <div className="market-price-value">
                        {price.available === false ? 'Indisponible' : `${nationalPrice.price.toLocaleString('fr-FR')} FCFA`}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Évolution</span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: nationalPrice.change > 0 ? 'var(--success)' : nationalPrice.change < 0 ? 'var(--danger)' : 'var(--text-secondary)',
                            background: nationalPrice.change > 0 ? 'rgba(46, 107, 65, 0.12)' : nationalPrice.change < 0 ? 'rgba(163, 59, 43, 0.12)' : 'rgba(74, 74, 66, 0.10)',
                            padding: '4px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {nationalPrice.change > 0 ? '+' : ''}{nationalPrice.change.toFixed(1)}%
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {filteredPrices.length === 0 && (
                <div className="market-empty market-search-empty" role="status">
                  <i className="fas fa-search" aria-hidden="true"></i>
                  <span>Aucun produit trouvé.</span>
                </div>
              )}
            </div>

            {showAiAnalysis && selectedProduct && (
              <div className="market-ai-modal-backdrop" role="presentation" onClick={() => setShowAiAnalysis(false)}>
                <div className="market-ai-modal" role="dialog" aria-modal="true" aria-labelledby="market-ai-title" onClick={event => event.stopPropagation()}>
                  <div className="market-ai-modal-header">
                    <div>
                      <span className="market-kicker">Analyse du produit</span>
                      <h2 id="market-ai-title">{selectedProduct.productTitle}</h2>
                    </div>
                    <button className="market-ai-close" type="button" aria-label="Fermer l’analyse IA" onClick={() => setShowAiAnalysis(false)}>
                      <i className="fas fa-times" aria-hidden="true"></i>
                    </button>
                  </div>
                  <PredictiveChat
                    key={selectedProduct.productId}
                    productName={selectedProduct.productTitle}
                    regionName="Cameroun"
                    siteData={{
                      currentPrice: getPriceForZone(selectedProduct, 'national').price,
                      forecast7: getPriceForZone(selectedProduct, 'national').price * (1 + selectedProduct.priceChangePercent / 100),
                      delta7: selectedProduct.priceChangePercent,
                    }}
                    autoPrompt={`Analyse le prix national actuel du ${selectedProduct.productTitle} et donne-moi un conseil.`}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </section>
  )
}
