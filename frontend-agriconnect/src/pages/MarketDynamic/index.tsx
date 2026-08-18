import React, { useEffect, useMemo, useState } from 'react'
import PriceDisplay from '../../components/PriceDisplay'
import PriceChart from '../../components/PriceChart'
import LimitOrderForm from '../../components/LimitOrderForm'
import { getMarketPrices, getPriceHistory, getLimitOrders, buildNationalZoneSeries, getPriceForZone, type PriceData, type PriceHistoryData, type LimitOrder } from '../../services/api'
import { useToasts } from '../../components/ToastProvider'
import './MarketDynamic.css';

export default function MarketDynamic() {
  const toasts = useToasts()
  const [prices, setPrices] = useState<PriceData[]>([])
  const [history, setHistory] = useState<PriceHistoryData[]>([])
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [marketNotice, setMarketNotice] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState('national')
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'disabled'>('connecting')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const selectedProductIdRef = React.useRef<string | null>(null)

  // Charger les prix initialement
  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true)
      try {
        const [pricesResult, ordersResult] = await Promise.allSettled([
          getMarketPrices(),
          getLimitOrders(),
        ])
        if (pricesResult.status === 'fulfilled') {
          const incomingPrices = Array.isArray(pricesResult.value.data.prices) ? pricesResult.value.data.prices : []
          setPrices(incomingPrices)
          setMarketNotice(pricesResult.value.data.meta?.message ?? null)
        } else {
          setPrices([])
          setMarketNotice('Le service de marché est temporairement indisponible.')
        }
        if (ordersResult.status === 'fulfilled') {
          setOrders(ordersResult.value.data.orders || [])
        } else {
          setOrders([])
        }
      } finally {
        setLoading(false)
      }
    }
    loadPrices()
  }, [toasts])

  // Mettre à jour la référence du produit sélectionné
  useEffect(() => {
    selectedProductIdRef.current = selectedProductId
  }, [selectedProductId])

  useEffect(() => {
    setSelectedProductId(current => {
      if (current && prices.some(price => price.productId === current)) return current
      return prices[0]?.productId ?? null
    })
  }, [prices])

  // Charger l'historique quand le produit change
  useEffect(() => {
    if (!selectedProductId) return

    let active = true
    setHistory([])
    setHistoryLoading(true)
    setHistoryError(null)
    const loadHistory = async () => {
      try {
        const res = await getPriceHistory(selectedProductId)
        if (active) setHistory(res.data.history)
      } catch (err) {
        if (active) setHistoryError('Historique momentanément indisponible.')
      } finally {
        if (active) setHistoryLoading(false)
      }
    }
    loadHistory()
    return () => { active = false }
  }, [selectedProductId])

  // WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const configuredWsUrl = import.meta.env.VITE_WS_URL?.trim()
    const apiUrl = import.meta.env.VITE_API_BASE_URL?.trim()
    const wsOrigin = apiUrl
      ? apiUrl.replace(/^http/, 'ws').replace(/\/api\/?$/, '')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    const wsUrl = configuredWsUrl || `${wsOrigin}/market/price-update`
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
        setPrices(Array.isArray(res.data.prices) ? res.data.prices : [])
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
            } else if (data.type === 'price_history' && data.productId === selectedProductIdRef.current) {
              setHistory(data.history)
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

  const selectedPrice = Array.isArray(prices) ? prices.find(p => p.productId === selectedProductId) : undefined
  const selectedZoneSeries = selectedPrice ? buildNationalZoneSeries(selectedPrice) : undefined
  const availableZones = useMemo(() => [
    'national',
    ...Array.from(new Set(prices.flatMap(price => price.regions?.map(region => region.zone) ?? []))),
  ], [prices])
  const selectedMarketPrice = selectedPrice ? getPriceForZone(selectedPrice, selectedZone) : undefined

  useEffect(() => {
    if (!availableZones.includes(selectedZone)) setSelectedZone('national')
  }, [availableZones, selectedZone])

  const handleRefreshPrices = async () => {
    try {
      const res = await getMarketPrices()
      setPrices(Array.isArray(res.data.prices) ? res.data.prices : [])
      setMarketNotice(res.data.meta?.message ?? null)
      toasts.push({ type: 'success', title: 'Succès', message: 'Prix mis à jour.' })
    } catch (err) {
      setMarketNotice('Le service de marché est temporairement indisponible. Les données affichées sont limitées.')
    }
  }

  const handleOrderCreated = async () => {
    try {
      const res = await getLimitOrders()
      setOrders(res.data.orders || [])
    } catch (err) {
      console.error('Erreur lors du rechargement des ordres:', err)
    }
  }

  return (
    <section className="page market-page">
      <div className="page-header market-header">
        <div>
          <h1><i className="fas fa-chart-line" style={{ color: 'var(--primary)' }}></i> Marché Dynamique</h1>
          <div className="sub">Consultez les prix en direct et créez des ordres à prix limite</div>
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

      <div className="market-control-bar card">
        <div>
          <span className="market-kicker">Territoire de référence</span>
          <h2>Comparer les prix par zone</h2>
          <p>Les variations affichées correspondent aux cotations fournies pour la zone sélectionnée.</p>
        </div>
        <label className="market-zone-select">
          <span>Région / zone</span>
          <select value={selectedZone} onChange={event => setSelectedZone(event.target.value)}>
            {availableZones.map(zone => <option key={zone} value={zone}>{zone === 'national' ? 'Moyenne nationale' : zone}</option>)}
          </select>
        </label>
      </div>

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
          <div className="market-left">
            <PriceDisplay prices={prices} onSelectProduct={setSelectedProductId} selectedZone={selectedZone} />
          </div>

          <div className="market-right">
            <div className="market-national-card card">
              <div className="market-section-heading">
                <div>
                  <span className="market-kicker">Cotation nationale</span>
                  <h2><i className="fas fa-seedling"></i> Produits du marché</h2>
                </div>
                <span className="market-section-note">Prix observés à l'échelle du Cameroun</span>
              </div>

              <div className="market-product-grid">
                {prices.map(price => {
                  const isSelected = selectedProductId === price.productId
                  const regionalPrice = getPriceForZone(price, selectedZone)
                  const zoneSpread = price.regions && price.regions.length > 1
                    ? Math.max(...price.regions.map(zone => zone.price)) - Math.min(...price.regions.map(zone => zone.price))
                    : 0

                  return (
                    <button
                      key={price.productId}
                      onClick={() => setSelectedProductId(price.productId)}
                      style={{
                        textAlign: 'left',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                        borderRadius: 12,
                        padding: 14,
                        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong className="market-product-title">{price.productTitle}</strong>
                        <span className="badge success">{price.category}</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>
                        {regionalPrice.price.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
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
                          {regionalPrice.change > 0 ? '+' : ''}{regionalPrice.change.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                        {regionalPrice.hasRegionalData ? `Écart entre zones : ${zoneSpread.toLocaleString('fr-FR')} FCFA` : 'Variation régionale non fournie'}
                      </div>
                      <div className="market-ai-note">
                        <i className="fas fa-brain" aria-hidden="true"></i>
                        <span><strong>Analyse IA :</strong> {price.aiInsight || 'Analyse de variation en attente des données du module IA.'}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Unité : {price.unit}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedPrice && (
              <>
                {historyLoading ? (
                  <div className="market-substate card" role="status">Chargement de l’historique...</div>
                ) : historyError ? (
                  <div className="market-substate market-substate-error card">{historyError}</div>
                ) : (
                  <PriceChart
                    productTitle={selectedPrice.productTitle}
                    history={history}
                    zoneSeries={selectedZoneSeries}
                  />
                )}

                <LimitOrderForm
                  productId={selectedPrice.productId}
                  productTitle={selectedPrice.productTitle}
                  currentPrice={selectedMarketPrice?.price ?? selectedPrice.currentPrice}
                  unit={selectedPrice.unit}
                  onOrderCreated={handleOrderCreated}
                />

                {/* Ordres limites actifs */}
                <div className="market-orders-card card">
                  <h2>
                    <i className="fas fa-list"></i> Vos ordres limites
                  </h2>

                  {orders.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Aucun ordre pour le moment</p>
                  ) : (
                    <div className="orders-list">
                      {orders.map(order => (
                        <div
                          key={order.id}
                          className="order-item"
                          style={{
                            padding: 12,
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div className="order-item-main">
                            <div className="order-item-title">
                              {order.productTitle}
                            </div>
                            <div className="order-item-meta">
                              {order.quantity} {order.unit} à {order.limitPrice.toLocaleString('fr-FR')} FCFA/unité
                            </div>
                          </div>
                          <div className="order-item-status">
                            <span
                              className={`badge ${
                                order.status === 'matched'
                                  ? 'success'
                                  : order.status === 'pending'
                                    ? 'warning'
                                    : 'danger'
                              }`}
                            >
                              {order.status === 'matched'
                                ? '✓ Exécuté'
                                : order.status === 'pending'
                                  ? '⏳ En attente'
                                  : '✗ Annulé'}
                            </span>
                            {order.matchedAt && (
                              <div className="order-item-date">
                                {new Date(order.matchedAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
