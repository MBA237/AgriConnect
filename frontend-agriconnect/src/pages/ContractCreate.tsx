import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createContract } from '../services/api'

export default function ContractCreate() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('XAF')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [certified, setCertified] = useState(true)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      const response = await createContract({
        title,
        buyerName,
        sellerName,
        amount: Number(amount),
        currency,
        deliveryDate,
        certified,
      })
      const created = response?.data?.contract || response?.data
      if (created?.id) {
        navigate(`/contracts/${created.id}`)
      } else {
        navigate('/contracts')
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Impossible de créer le contrat.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-content">
      <section className="card space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Contrats</p>
          <h1>Création de contrat</h1>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="input-group">
            <label>Titre du contrat</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Prix garanti - Maïs" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label>Nom acheteur</label>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Nom vendeur</label>
              <input value={sellerName} onChange={e => setSellerName(e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label>Montant</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Devise</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="XAF">XAF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Date de livraison</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={certified} onChange={e => setCertified(e.target.checked)} />
            Certifier sur blockchain
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Création...' : 'Créer le contrat'}
          </button>
        </form>
      </section>
    </main>
  )
}
