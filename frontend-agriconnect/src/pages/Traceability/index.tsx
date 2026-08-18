import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import QrScanner from '../../components/QrScanner'
import { createTraceabilityEntry, getContracts, getMyOrders, getTraceabilityHistoryByProduct } from '../../services/api'
import './Traceability.css';

type TraceabilityItem = {
  id: string
  qrCode: string
  productId: string
  productName: string
  location: string
  status: string
  note?: string
  createdAt?: string
}

type TrackingItem = {
  id: string
  kind: 'order' | 'contract' | 'traceability'
  title: string
  status: string
  location?: string
  detailPath?: string
  qrCode?: string
  date?: string
  amount?: string
}

type TrackingFilter = 'all' | TrackingItem['kind']

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'En attente', paid: 'Payée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
    pending_payment: 'Paiement en attente', in_transit: 'En transit', completed: 'Terminée',
  }
  return labels[status.toLowerCase()] ?? (status || 'Non renseigné')
}

function mapUrl(location?: string) {
  return location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : ''
}

export default function Traceability() {
  const [entries, setEntries] = useState<TraceabilityItem[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [filter, setFilter] = useState<TrackingFilter>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    try {
      setLoading(true)
      const [historyResult, ordersResult, contractsResult] = await Promise.allSettled([
        getTraceabilityHistoryByProduct(''),
        getMyOrders(),
        getContracts(),
      ])
      if (historyResult.status === 'fulfilled') setEntries(Array.isArray(historyResult.value?.data?.history) ? historyResult.value.data.history : [])
      if (ordersResult.status === 'fulfilled') setOrders(Array.isArray(ordersResult.value?.data?.orders) ? ordersResult.value.data.orders : [])
      if (contractsResult.status === 'fulfilled') setContracts(Array.isArray(contractsResult.value?.data?.contracts) ? contractsResult.value.data.contracts : [])
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Impossible de charger l’historique.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadHistory() }, [])

  const trackingItems = useMemo<TrackingItem[]>(() => {
    const locationByProduct = new Map(entries.map(entry => [entry.productId, entry.location]).filter(([, location]) => Boolean(location)))
    const orderItems: TrackingItem[] = orders.map(order => {
      const firstItem = order.items?.[0]
      const product = firstItem?.product
      const location = firstItem?.location || product?.location || locationByProduct.get(product?.id)
      return {
        id: `order-${order.id}`,
        kind: 'order',
        title: `Commande ${String(order.id).slice(0, 8)}`,
        status: statusLabel(order.status),
        location,
        detailPath: `/orders/${order.id}`,
        date: order.createdAt,
        amount: `${Number(order.totalAmount ?? order.total ?? 0).toLocaleString('fr-FR')} FCFA`,
      }
    })
    const contractItems: TrackingItem[] = contracts.map(contract => ({
      id: `contract-${contract.id}`,
      kind: 'contract',
      title: contract.title || `Contrat ${String(contract.id).slice(0, 8)}`,
      status: statusLabel(contract.status),
      location: contract.location,
      detailPath: `/contracts/${contract.id}`,
      date: contract.createdAt,
      amount: contract.amount ? `${Number(contract.amount).toLocaleString('fr-FR')} ${contract.currency || 'XAF'}` : undefined,
    }))
    const traceItems: TrackingItem[] = entries.map(entry => ({
      id: `trace-${entry.id}`,
      kind: 'traceability',
      title: entry.productName || 'Lot agricole',
      status: statusLabel(entry.status),
      location: entry.location,
      detailPath: `/traceability/${entry.qrCode}`,
      qrCode: entry.qrCode,
      date: entry.createdAt,
    }))
    return [...orderItems, ...contractItems, ...traceItems].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
  }, [contracts, entries, orders])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return trackingItems.filter(item => {
      const matchesType = filter === 'all' || item.kind === filter
      const matchesSearch = !term || item.title.toLowerCase().includes(term) || item.status.toLowerCase().includes(term) || item.location?.toLowerCase().includes(term)
      return matchesType && matchesSearch
    })
  }, [filter, search, trackingItems])

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => { setCurrentPage(1) }, [filter, search])
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleScan = async (qrCode: string) => {
    try {
      const response = await createTraceabilityEntry({ qrCode })
      if (response?.data?.entry?.qrCode) {
        window.location.assign(`/traceability/${response.data.entry.qrCode}`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Échec de l’enregistrement du lot.')
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Traçabilité</p>
          <h1>Page de traçabilité</h1>
        </div>
      </div>

      <div className="card space-y-6">
        <QrScanner onScan={handleScan} />

        {error ? (
          <div className="alert alert-error">
            <div className="alert-body">
              <div className="alert-title">Erreur</div>
              <div className="alert-message">{error}</div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 traceability-history">
          <div className="traceability-history-heading">
            <div>
              <span className="traceability-kicker">Suivi global</span>
              <h2>Commandes, contrats et lots</h2>
            </div>
            <span className="traceability-count">{trackingItems.length} élément{trackingItems.length > 1 ? 's' : ''}</span>
          </div>
          <div className="traceability-toolbar">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une commande, un contrat ou un lieu" aria-label="Rechercher dans la traçabilité" />
            <div className="traceability-filters" role="group" aria-label="Filtrer les éléments">
              {([['all', 'Tous'], ['order', 'Commandes'], ['contract', 'Contrats'], ['traceability', 'Lots']] as Array<[TrackingFilter, string]>).map(([value, label]) => (
                <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
              ))}
            </div>
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : filteredItems.length === 0 ? (
            <div className="card">Aucune commande, aucun contrat ou lot enregistré.</div>
          ) : (
            visibleItems.map(item => (
              <article key={item.id} className="traceability-item card">
                <div className={`traceability-item-icon ${item.kind}`}><i className={`fas ${item.kind === 'order' ? 'fa-box' : item.kind === 'contract' ? 'fa-file-contract' : 'fa-qrcode'}`} aria-hidden="true"></i></div>
                <div className="traceability-item-main">
                  <div className="traceability-item-topline"><strong title={item.title}>{item.title}</strong><span className={`traceability-status ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span></div>
                  <div className="traceability-item-meta">{item.amount || 'Suivi de traçabilité'}{item.date ? ` · ${new Date(item.date).toLocaleDateString('fr-FR')}` : ''}</div>
                  {item.location ? <div className="traceability-location"><i className="fas fa-map-marker-alt" aria-hidden="true"></i>{item.location}</div> : <div className="traceability-location unavailable">Localisation non renseignée</div>}
                </div>
                <div className="traceability-item-actions">
                  {item.location ? <a className="btn-small btn-small-outline" href={mapUrl(item.location)} target="_blank" rel="noreferrer"><i className="fas fa-map-marked-alt" aria-hidden="true"></i> Localiser</a> : null}
                  {item.detailPath ? <Link className="btn-small btn-small-outline" to={item.detailPath}>Détails</Link> : null}
                </div>
              </article>
            ))
          )}
          {!loading && totalPages > 1 && (
            <nav className="traceability-pagination" aria-label="Pagination de la traçabilité">
              <button type="button" className="btn-small btn-small-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(page => page - 1)}>Précédent</button>
              <span>Page {currentPage} sur {totalPages}</span>
              <button type="button" className="btn-small btn-small-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => page + 1)}>Suivant</button>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}
