import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ContractStatus from '../components/ContractStatus'
import { getContractDetail, payContract, confirmDelivery } from '../services/api'

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadContract = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await getContractDetail(id)
      setContract(response?.data?.contract || response?.data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Impossible de charger le contrat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadContract() }, [id])

  const handlePay = async () => {
    if (!id) return
    try {
      await payContract(id)
      await loadContract()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Paiement impossible.')
    }
  }

  const handleConfirmDelivery = async () => {
    if (!id) return
    try {
      await confirmDelivery(id)
      await loadContract()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Confirmation impossible.')
    }
  }

  if (loading) return <main className="page-content"><section className="card">Chargement...</section></main>
  if (error) return <main className="page-content"><section className="card">{error}</section></main>
  if (!contract) return <main className="page-content"><section className="card">Contrat introuvable.</section></main>

  return (
    <main className="page-content">
      <section className="card space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Contrat</p>
            <h1>{contract.title || 'Contrat sécurisé'}</h1>
          </div>
          <ContractStatus status={contract.status} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3>Détails</h3>
            <p><strong>Acheteur :</strong> {contract.buyerName}</p>
            <p><strong>Vendeur :</strong> {contract.sellerName}</p>
            <p><strong>Montant :</strong> {contract.amount} {contract.currency}</p>
            <p><strong>Livraison :</strong> {contract.deliveryDate || 'Non définie'}</p>
          </div>

          <div className="card">
            <h3>Certification blockchain</h3>
            <p>{contract.certified ? 'Ce contrat est certifié blockchain.' : 'Pas de certification.'}</p>
            {contract.blockchainHash ? <p><strong>Hash :</strong> {contract.blockchainHash}</p> : null}
          </div>
        </div>

        <div className="contract-actions">
          <button type="button" className="btn-small-success" onClick={handlePay}>Payer</button>
          <button type="button" className="btn-small-blockchain" onClick={handleConfirmDelivery}>Confirmer livraison</button>
        </div>
      </section>
    </main>
  )
}
