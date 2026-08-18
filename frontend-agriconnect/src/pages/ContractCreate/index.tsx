import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createContract, getRegisteredUsers, type RegisteredUser } from '../../services/api'
import { useToasts } from '../../components/ToastProvider'
import './ContractCreate.css';

export default function ContractCreate() {
  const navigate = useNavigate()
  const toasts = useToasts()
  const [title, setTitle] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('XAF')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [location, setLocation] = useState('')
  const [certified, setCertified] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [buyerId, setBuyerId] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => {
    let active = true
    void getRegisteredUsers().then(response => {
      if (active) setUsers(response.data.users)
    }).catch(() => {
      if (active) setError('Impossible de charger les utilisateurs enregistrés.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!coverImage) {
      setCoverPreview('')
      return
    }
    const preview = URL.createObjectURL(coverImage)
    setCoverPreview(preview)
    return () => URL.revokeObjectURL(preview)
  }, [coverImage])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!title.trim() || !buyerId || !sellerId || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !coverImage) {
      setError('Sélectionnez un acheteur, un vendeur, un montant positif et une image de couverture.')
      return
    }
    try {
      setLoading(true)
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(coverImage)
      })
      const response = await createContract({
        title,
        buyerId,
        sellerId,
        amount: Number(amount),
        currency,
        deliveryDate,
        location,
        certified,
        image,
      })
      const created = response?.data?.contract || response?.data
      if (created?.id) {
        toasts.push({ type: 'success', title: 'Contrat publié', message: 'Le contrat a été créé avec succès.' })
        navigate(`/contracts/${created.id}`)
      } else {
        toasts.push({ type: 'success', title: 'Contrat publié', message: 'Le contrat a été créé.' })
        navigate('/contracts')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Impossible de créer le contrat.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-content contract-create-page">
      <section className="card space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Contrats</p>
          <h1>Création de contrat</h1>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {error ? <div className="alert alert-error" role="alert"><div className="alert-body"><div className="alert-title">Publication impossible</div><div className="alert-message">{error}</div></div></div> : null}
          <div className="input-group">
            <label>Titre du contrat</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Prix garanti - Maïs" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label htmlFor="buyerName">Rechercher l’acheteur *</label>
              <input id="buyerName" value={buyerName} onChange={event => { setBuyerName(event.target.value); setBuyerId(users.find(user => (user.fullName || user.email) === event.target.value)?.id || '') }} list="contract-users" required placeholder="Nom ou email enregistré" />
            </div>
            <div className="input-group">
              <label htmlFor="sellerName">Rechercher le vendeur *</label>
              <input id="sellerName" value={sellerName} onChange={event => { setSellerName(event.target.value); setSellerId(users.find(user => (user.fullName || user.email) === event.target.value)?.id || '') }} list="contract-users" required placeholder="Nom ou email enregistré" />
            </div>
            <datalist id="contract-users">
              {users.map(user => <option key={user.id} value={user.fullName || user.email}>{user.email} · {user.role}</option>)}
            </datalist>
          </div>

          <div className="contract-cover-field input-group">
            <label htmlFor="contract-cover">Image de couverture *</label>
            <input id="contract-cover" type="file" accept="image/*" required onChange={event => setCoverImage(event.target.files?.[0] || null)} />
            {coverPreview ? <img className="contract-cover-preview" src={coverPreview} alt="Aperçu de la couverture du contrat" /> : <span className="field-help">Ajoutez une image qui représentera le contrat.</span>}
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

          <div className="input-group">
            <label htmlFor="contract-location">Localisation du contrat</label>
            <input id="contract-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ville, marché ou adresse" />
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
