import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ContractStatus from '../../components/ContractStatus'
import ContractQrCode from '../../components/ContractQrCode'
import { getContracts, payContract, confirmDelivery } from '../../services/api'
import { useToasts } from '../../components/ToastProvider'
import './Contracts.css';

export type ContractItem = {
  id: string
  title: string
  buyerName: string
  sellerName: string
  amount: number
  currency: string
  status: string
  deliveryDate?: string
  blockchainHash?: string
  certified?: boolean
  image?: string
}

export default function Contracts() {
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const toasts = useToasts()
  const pageSize = 6

  const loadContracts = async () => {
    try {
      setLoading(true)
      const response = await getContracts()
      const items = Array.isArray(response?.data?.contracts)
        ? response.data.contracts
        : Array.isArray(response?.data)
          ? response.data
          : []
      setContracts(items)
      setCurrentPage(1)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Impossible de charger les contrats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadContracts() }, [])

  const totalPages = Math.max(1, Math.ceil(contracts.length / pageSize))
  const visibleContracts = useMemo(
    () => contracts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [contracts, currentPage],
  )

  const handlePay = async (id: string) => {
    try {
      setAction(`pay:${id}`)
      await payContract(id)
      toasts.push({ type: 'success', title: 'Paiement enregistré', message: 'Le statut du contrat a été mis à jour.' })
      await loadContracts()
    } catch (err: any) {
      toasts.push({ type: 'error', title: 'Paiement impossible', message: err?.response?.data?.message || err?.response?.data?.error || 'Réessayez plus tard.' })
    } finally {
      setAction(null)
    }
  }

  const handleConfirmDelivery = async (id: string) => {
    try {
      setAction(`delivery:${id}`)
      await confirmDelivery(id)
      toasts.push({ type: 'success', title: 'Livraison confirmée', message: 'La livraison du contrat est confirmée.' })
      await loadContracts()
    } catch (err: any) {
      toasts.push({ type: 'error', title: 'Confirmation impossible', message: err?.response?.data?.message || err?.response?.data?.error || 'Réessayez plus tard.' })
    } finally {
      setAction(null)
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Contrats</p>
          <h1>Liste des contrats</h1>
        </div>
        <Link to="/contracts/new" className="btn-primary">Créer un contrat</Link>
      </div>

      <div className="card space-y-6">
        {error ? (
          <div className="alert alert-error">
            <div className="alert-body">
              <div className="alert-title">Erreur</div>
              <div className="alert-message">{error}</div>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p>Chargement...</p>
        ) : contracts.length === 0 ? (
          <div className="card">Aucun contrat disponible pour le moment.</div>
        ) : (
          <>
            <div className="contracts-list">
            {visibleContracts.map(contract => (
              <article key={contract.id} className="card contract-card">
                {(() => {
                  const contractStatus = String(contract.status || '').toUpperCase()
                  const canPay = contractStatus === 'PENDING'
                  const canConfirmDelivery = contractStatus === 'PAID'

                  return <>
                <div className="contract-header">
                  {contract.image ? <img className="contract-list-image" src={contract.image} alt="" /> : <div className="contract-list-image contract-list-image-placeholder"><i className="fas fa-file-contract" aria-hidden="true"></i></div>}
                  <div>
                    <div className="product-name contract-title" title={contract.title}>{contract.title}</div>
                    <div className="contract-details">
                      <span title={`${contract.buyerName} vers ${contract.sellerName}`}>{contract.buyerName} → {contract.sellerName}</span>
                      <span>• {contract.amount.toLocaleString('fr-FR')} {contract.currency}</span>
                    </div>
                  </div>
                  <ContractStatus status={contract.status} />
                </div>

                <div className="contract-details" style={{ marginTop: 8 }}>
                  {contract.deliveryDate ? <>Livraison prévue : {contract.deliveryDate}</> : null}
                </div>

                <div className="contract-actions">
                  <Link to={`/contracts/${contract.id}`} className="btn-outline">Voir le détail</Link>
                  <button type="button" className="btn-small-success" disabled={action !== null || !canPay} onClick={() => handlePay(contract.id)}>
                    {action === `pay:${contract.id}` ? 'Paiement...' : canPay ? 'Payer' : 'Paiement effectué'}
                  </button>
                  <button type="button" className="btn-small-blockchain" disabled={action !== null || !canConfirmDelivery} onClick={() => handleConfirmDelivery(contract.id)}>
                    {action === `delivery:${contract.id}` ? 'Confirmation...' : canConfirmDelivery ? 'Confirmer livraison' : 'Disponible après paiement'}
                  </button>
                </div>

                {contract.blockchainHash ? (
                  <div className="contract-qr-row">
                    <ContractQrCode value={contract.blockchainHash} />
                    <span>Scanner pour vérifier le contrat</span>
                  </div>
                ) : null}

                {contract.certified ? (
                  <span className="badge-blockchain" style={{ marginTop: 8, display: 'inline-flex' }}>
                    <i className="fas fa-shield-alt"></i> Certifié blockchain
                  </span>
                ) : null}
                  </>
                })()}
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="contracts-pagination" aria-label="Pagination des contrats">
              <button type="button" className="btn-small btn-small-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(page => page - 1)}>
                <i className="fas fa-chevron-left" aria-hidden="true"></i> Précédent
              </button>
              <span>Page {currentPage} sur {totalPages}</span>
              <button type="button" className="btn-small btn-small-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => page + 1)}>
                Suivant <i className="fas fa-chevron-right" aria-hidden="true"></i>
              </button>
            </nav>
          )}
          </>
        )}
      </div>
    </section>
  )
}
