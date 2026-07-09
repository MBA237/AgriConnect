import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ContractStatus from '../components/ContractStatus'
import { createContract, getContracts, payContract, confirmDelivery } from '../services/api'

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
}

export default function Contracts() {
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Impossible de charger les contrats.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadContracts() }, [])

  const handlePay = async (id: string) => {
    try {
      await payContract(id)
      await loadContracts()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Paiement impossible.')
    }
  }

  const handleConfirmDelivery = async (id: string) => {
    try {
      await confirmDelivery(id)
      await loadContracts()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Confirmation impossible.')
    }
  }

  return (
    <main className="page-content">
      <section className="card space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Contrats</p>
            <h1>Liste des contrats</h1>
          </div>
          <Link to="/contracts/new" className="btn-primary">Créer un contrat</Link>
        </div>

        {error ? <div className="alert-danger">{error}</div> : null}

        {loading ? (
          <p>Chargement...</p>
        ) : contracts.length === 0 ? (
          <div className="card">Aucun contrat disponible pour le moment.</div>
        ) : (
          <div className="space-y-4">
            {contracts.map(contract => (
              <article key={contract.id} className="contract-card">
                <div className="contract-header">
                  <div>
                    <div className="product-name">{contract.title}</div>
                    <div className="contract-details">
                      {contract.buyerName} → {contract.sellerName} • {contract.amount} {contract.currency}
                    </div>
                  </div>
                  <ContractStatus status={contract.status} />
                </div>

                <div className="contract-details">
                  {contract.deliveryDate ? <>Livraison prévue : {contract.deliveryDate}</> : null}
                </div>

                <div className="contract-actions">
                  <Link to={`/contracts/${contract.id}`} className="btn-outline">Voir le détail</Link>
                  <button type="button" className="btn-small-success" onClick={() => handlePay(contract.id)}>
                    Payer
                  </button>
                  <button type="button" className="btn-small-blockchain" onClick={() => handleConfirmDelivery(contract.id)}>
                    Confirmer livraison
                  </button>
                </div>

                {contract.blockchainHash ? (
                  <div className="blockchain-tx" style={{ marginTop: 8 }}>
                    <i className="fas fa-link"></i>
                    {contract.blockchainHash}
                  </div>
                ) : null}

                {contract.certified ? (
                  <span className="badge-blockchain" style={{ marginTop: 8, display: 'inline-flex' }}>
                    <i className="fas fa-shield-alt"></i> Certifié blockchain
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
