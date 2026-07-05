import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageUpload from '../components/ImageUpload'
import { createProduct, updateProduct, getProduct } from '../services/api'
import { useToasts } from '../components/ToastProvider'
import useSession from '../hooks/useSession'

export default function CreateOffer() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toasts = useToasts()
  const { session } = useSession()
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!id)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    title: '',
    category: 'Céréales',
    price: '',
    unit: 'kg',
    location: 'Dschang',
    stock: '',
    quality: 'Premium',
    deliveryTime: '24h',
    description: '',
    farmerName: 'M. Tchouga',
  })

  useEffect(() => {
    if (!id) return
    
    const loadProduct = async () => {
      try {
        const res = await getProduct(id)
        const product = res.data.product
        setForm({
          title: product.title,
          category: product.category,
          price: product.price.toString(),
          unit: product.unit,
          location: product.location,
          stock: product.stock.toString(),
          quality: product.quality,
          deliveryTime: product.deliveryTime,
          description: product.description,
          farmerName: product.farmerName,
        })
      } catch (err) {
        toasts.push({ type: 'error', title: 'Erreur', message: 'Impossible de charger l\'offre.' })
        navigate('/catalog')
      } finally {
        setLoading(false)
      }
    }
    
    loadProduct()
  }, [id, navigate, toasts])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.title.trim()) newErrors.title = 'Le titre est requis'
    if (!form.description.trim()) newErrors.description = 'La description est requise'
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Le prix doit être supérieur à 0'
    if (!form.stock || Number(form.stock) <= 0) newErrors.stock = 'Le stock doit être supérieur à 0'
    if (!form.location.trim()) newErrors.location = 'La localisation est requise'
    if (!form.deliveryTime.trim()) newErrors.deliveryTime = 'Le délai de livraison est requis'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  if (session.user?.role !== 'agriculteur') {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <h1><i className="fas fa-lock" style={{ color: 'var(--primary)' }}></i> Accès réservé</h1>
            <div className="sub">La publication d'offres est réservée aux agriculteurs.</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <p>Connectez-vous avec un compte agriculteur pour déposer une nouvelle offre.</p>
          <button className="btn-outline" type="button" onClick={() => navigate('/catalog')} style={{ marginTop: 12 }}>Retour au catalogue</button>
        </div>
      </section>
    )
  }

  if (loading) return <div className="card">Chargement...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        ownerId: session.user?.id,
        publishedAt: new Date().toISOString(),
        images: files.length > 0 ? files.map(file => URL.createObjectURL(file)) : undefined,
      }

      if (id) {
        await updateProduct(id, payload)
        toasts.push({ type: 'success', title: 'Succès', message: 'Offre mise à jour avec succès.' })
        navigate(`/products/${id}`)
      } else {
        const res = await createProduct(payload)
        toasts.push({ type: 'success', title: 'Offre publiée', message: 'Votre offre a bien été enregistrée.' })
        navigate(`/products/${res.data.product.id}`)
      }
    } catch (err) {
      toasts.push({ type: 'error', title: 'Erreur', message: id ? 'Impossible de mettre à jour l\'offre.' : 'Impossible de publier l\'offre.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-plus-circle" style={{ color: 'var(--primary)' }}></i> {id ? 'Modifier l\'offre' : 'Publier une offre'}</h1>
          <div className="sub">{id ? 'Mettez à jour votre offre' : 'Déposez une nouvelle offre pour attirer des acheteurs'}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <form className="offer-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="input-group">
              <label>Titre de l'offre *</label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="Ex. Maïs blanc premium" 
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.title}</span>}
            </div>
            <div className="input-group">
              <label>Catégorie</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option>Céréales</option>
                <option>Légumes</option>
                <option>Fruits</option>
                <option>Élevage</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label>Prix (FCFA) *</label>
              <input 
                name="price" 
                type="number"
                value={form.price} 
                onChange={handleChange} 
                placeholder="5000" 
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.price}</span>}
            </div>
            <div className="input-group">
              <label>Unité</label>
              <select name="unit" value={form.unit} onChange={handleChange}>
                <option value="kg">kg</option>
                <option value="sac">sac</option>
                <option value="tonne">tonne</option>
                <option value="unités">unités</option>
                <option value="pièce">pièce</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label>Localisation *</label>
              <input 
                name="location" 
                value={form.location} 
                onChange={handleChange} 
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.location}</span>}
            </div>
            <div className="input-group">
              <label>Stock disponible *</label>
              <input 
                name="stock" 
                type="number"
                value={form.stock} 
                onChange={handleChange} 
                className={errors.stock ? 'error' : ''}
              />
              {errors.stock && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.stock}</span>}
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label>Qualité</label>
              <select name="quality" value={form.quality} onChange={handleChange}>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Bio">Bio</option>
              </select>
            </div>
            <div className="input-group">
              <label>Délai de livraison *</label>
              <input 
                name="deliveryTime" 
                value={form.deliveryTime} 
                onChange={handleChange} 
                placeholder="Ex. 24h, 48h"
                className={errors.deliveryTime ? 'error' : ''}
              />
              {errors.deliveryTime && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.deliveryTime}</span>}
            </div>
          </div>

          <div className="input-group">
            <label>Nom du vendeur</label>
            <input 
              name="farmerName" 
              value={form.farmerName} 
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Description *</label>
            <textarea 
              name="description" 
              rows={4} 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Décrivez votre produit..." 
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{errors.description}</span>}
          </div>

          <div className="input-group">
            <label>Images</label>
            <ImageUpload files={files} onFilesChange={setFiles} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? (id ? 'Mise à jour...' : 'Publication...') : (id ? 'Mettre à jour' : 'Publier l\'offre')}
            </button>
            <button className="btn-outline" type="button" onClick={() => navigate('/catalog')}>Annuler</button>
          </div>
        </form>
      </div>
    </section>
  )
}
