import React, { useEffect, useState } from 'react'
import PriceDisplay from '../components/PriceDisplay'
import PriceChart from '../components/PriceChart'
import LimitOrderForm from '../components/LimitOrderForm'
import { getMarketPrices, getPriceHistory, getLimitOrders, type PriceData, type PriceHistoryData, type LimitOrder } from '../services/api'
import { useToasts } from '../components/ToastProvider'

export default function MarketDynamic() {
  const toasts = useToasts()
  const [prices, setPrices] = useState<PriceData[]>([])
  const [history, setHistory] = useState<PriceHistoryData[]>([])
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'disabled'>('connecting')
  const selectedProductIdRef = React.useRef<string | null>(null)

  // Charger les prix initialement
  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true)
      try {
        const [pricesRes, ordersRes] = await Promise.all([
          getMarketPrices(),
          getLimitOrders(),
        ])
        const incomingPrices = Array.isArray(pricesRes.data.prices) ? pricesRes.data.prices : []
        setPrices(incomingPrices)
        setOrders(ordersRes.data.orders)
        if (incomingPrices.length > 0) {
          setSelectedProductId(incomingPrices[0].productId)
        }
      } catch (err) {
        toasts.push({ type: 'error', title: 'Erreur', message: 'Impossible de charger les prix.' })
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

  // Charger l'historique quand le produit change
  useEffect(() => {
    if (!selectedProductId) return

    const loadHistory = async () => {
      try {
        const res = await getPriceHistory(selectedProductId)
        setHistory(res.data.history)
      } catch (err) {
        console.error('Erreur lors du chargement de l\'historique:', err)
      }
    }
    loadHistory()
  }, [selectedProductId])

  // WebSocket pour les mises à jour en temps réel
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL?.trim()
    let websocket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let pollTimer: number | null = null
    let shouldReconnect = true

    const refreshPrices = async () => {
      try {
        const res = await getMarketPrices()
        setPrices(Array.isArray(res.data.prices) ? res.data.prices : [])
      } catch (err) {
        console.error('Erreur lors du rafraîchissement des prix:', err)
      }
    }

    const connectWebSocket = () => {
      if (!wsUrl) {
        console.warn('Aucun WebSocket configuré, fallback au polling.')
        setWsStatus('disabled')
        pollTimer = window.setInterval(refreshPrices, 10000)
        return
      }

      setWsStatus('connecting')

      try {
        websocket = new WebSocket(wsUrl)

        websocket.onopen = () => {
          console.log('Connecté au marché en temps réel')
          setWs(websocket)
          setWsStatus('connected')
        }

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'price_update') {
              setPrices(prevPrices =>
                prevPrices.map(p =>
                  p.productId === data.productId
                    ? { ...p, ...data.priceData, timestamp: new Date().toISOString() }
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

        websocket.onerror = (event) => {
          console.error('Erreur WebSocket:', event)
          setWsStatus('closed')
        }

        websocket.onclose = () => {
          console.log('Déconnecté du marché')
          setWs(null)
          setWsStatus('closed')
          if (shouldReconnect) {
            reconnectTimer = window.setTimeout(connectWebSocket, 3000)
          }
        }
      } catch (err) {
        console.error('Erreur connexion WebSocket:', err)
        setWsStatus('closed')
        reconnectTimer = window.setTimeout(connectWebSocket, 3000)
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

  const handleRefreshPrices = async () => {
    try {
      const res = await getMarketPrices()
      setPrices(Array.isArray(res.data.prices) ? res.data.prices : [])
      toasts.push({ type: 'success', title: 'Succès', message: 'Prix mis à jour.' })
    } catch (err) {
      toasts.push({ type: 'error', title: 'Erreur', message: 'Impossible de rafraîchir les prix.' })
    }
  }

  const handleOrderCreated = async () => {
    try {
      const res = await getLimitOrders()
      setOrders(res.data.orders)
    } catch (err) {
      console.error('Erreur lors du rechargement des ordres:', err)
    }
  }

  return (
    <section className="page market-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-chart-line" style={{ color: 'var(--primary)' }}></i> Marché Dynamique</h1>
          <div className="sub">Consultez les prix en direct et créez des ordres à prix limite</div>
        </div>
        <div className="actions">
          <span style={{ marginRight: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <i className={`fas fa-circle ${wsStatus === 'connected' ? 'live' : 'offline'}`}></i>
            {wsStatus === 'connected' ? 'En direct' : wsStatus === 'connecting' ? 'Connexion...' : wsStatus === 'disabled' ? 'WebSocket désactivé' : 'Hors ligne'}
          </span>
          <button className="btn-small btn-small-outline" onClick={handleRefreshPrices}>
            <i className="fas fa-sync-alt"></i> Rafraîchir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">Chargement des prix...</div>
      ) : (
        <div className="market-grid">
          <div className="market-left">
            <PriceDisplay prices={prices} onSelectProduct={setSelectedProductId} />
          </div>

          <div className="market-right">
            {selectedPrice && (
              <>
                <PriceChart
                  productTitle={selectedPrice.productTitle}
                  history={history}
                />

                <LimitOrderForm
                  productId={selectedPrice.productId}
                  productTitle={selectedPrice.productTitle}
                  currentPrice={selectedPrice.currentPrice}
                  unit={selectedPrice.unit}
                  onOrderCreated={handleOrderCreated}
                />

                {/* Ordres limites actifs */}
                <div className="card" style={{ marginTop: 16 }}>
                  <h3 style={{ marginBottom: 12 }}>
                    <i className="fas fa-list"></i> Vos ordres limites
                  </h3>

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
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {order.productTitle}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                              {order.quantity} {order.unit} à {order.limitPrice.toLocaleString('fr-FR')} FCFA/unité
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span
                              className={`badge ${
                                order.status === 'matched'
                                  ? 'success'
                                  : order.status === 'pending'
                                    ? 'warning'
                                    : 'danger'
                              }`}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 11,
                                fontWeight: 500,
                              }}
                            >
                              {order.status === 'matched'
                                ? '✓ Exécuté'
                                : order.status === 'pending'
                                  ? '⏳ En attente'
                                  : '✗ Annulé'}
                            </span>
                            {order.matchedAt && (
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
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
