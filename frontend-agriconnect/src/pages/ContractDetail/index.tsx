import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ContractStatus from '../../components/ContractStatus'
import ContractQrCode from '../../components/ContractQrCode'
import { getContractDetail, payContract, confirmDelivery } from '../../services/api'
import { useToasts } from '../../components/ToastProvider'
import './ContractDetail.css';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'pay' | 'delivery' | null>(null)
  const toasts = useToasts()

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
      setAction('pay')
      await payContract(id)
      toasts.push({ type: 'success', title: 'Paiement enregistré', message: 'Le statut du contrat a été mis à jour.' })
      await loadContract()
    } catch (err: any) {
      toasts.push({ type: 'error', title: 'Paiement impossible', message: err?.response?.data?.message || err?.response?.data?.error || 'Réessayez plus tard.' })
    } finally {
      setAction(null)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!id) return
    try {
      setAction('delivery')
      await confirmDelivery(id)
      toasts.push({ type: 'success', title: 'Livraison confirmée', message: 'La livraison du contrat est confirmée.' })
      await loadContract()
    } catch (err: any) {
      toasts.push({ type: 'error', title: 'Confirmation impossible', message: err?.response?.data?.message || err?.response?.data?.error || 'Réessayez plus tard.' })
    } finally {
      setAction(null)
    }
  }

  if (loading) return <main className="page-content contract-detail-page"><section className="card">Chargement...</section></main>
  if (error) return <main className="page-content contract-detail-page"><section className="card">{error}</section></main>
  if (!contract) return <main className="page-content contract-detail-page"><section className="card">Contrat introuvable.</section></main>

  const contractStatus = String(contract.status || '').toUpperCase()
  const canPay = contractStatus === 'PENDING'
  const canConfirmDelivery = contractStatus === 'PAID'

  return (
    <main className="page-content contract-detail-page">
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
            {contract.image ? <img className="contract-detail-cover" src={contract.image} alt="Couverture du contrat" /> : null}
            <h3>Détails</h3>
            <p><strong>Acheteur :</strong> {contract.buyerName}</p>
            <p><strong>Vendeur :</strong> {contract.sellerName}</p>
            <p><strong>Montant :</strong> {contract.amount} {contract.currency}</p>
            <p><strong>Livraison :</strong> {contract.deliveryDate || 'Non définie'}</p>
          </div>

          <div className="card">
            <h3>Certification blockchain</h3>
            <p>{contract.certified ? 'Ce contrat est certifié blockchain.' : 'Pas de certification.'}</p>
            {contract.blockchainHash ? (
              <div className="contract-qr-panel">
                <ContractQrCode value={contract.blockchainHash} />
                <span>Scanner pour vérifier le contrat</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="contract-actions">
          <button type="button" className="btn-small-success" disabled={action !== null || !canPay} onClick={handlePay}>{action === 'pay' ? 'Paiement...' : canPay ? 'Payer' : 'Paiement effectué'}</button>
          <button type="button" className="btn-small-blockchain" disabled={action !== null || !canConfirmDelivery} onClick={handleConfirmDelivery}>{action === 'delivery' ? 'Confirmation...' : canConfirmDelivery ? 'Confirmer livraison' : 'Disponible après paiement'}</button>
        </div>
      </section>
    </main>
  )
}
