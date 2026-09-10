import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSession from '../../hooks/useSession'
import { updateProfile, getUserStats, me } from '../../services/api'
import './Profile.css';

export default function Profile() {
  const { session, logout, updateUser } = useSession()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState<string>(session.user?.profileImage ?? '')

  const buildInitialForm = (user: any) => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    gender: user?.gender ?? '',
    farmName: user?.farmName ?? '',
    hectares: user?.hectares ?? '',
    products: user?.products ?? '',
    companyName: user?.companyName ?? '',
    siret: user?.siret ?? '',
  })

  const [form, setForm] = useState<any>(() => buildInitialForm(session.user))

  React.useEffect(() => {
    if (session.user) {
      setForm(buildInitialForm(session.user))
      setProfileImagePreview(session.user.profileImage ?? '')
    }
  }, [session.user])

  if (!session.user) {
    return (
      <div className="card">
        <div className="page-header">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Profil</p>
            <h1>Profil utilisateur</h1>
          </div>
        </div>
        <p className="text-slate-600">Aucun utilisateur connecté.</p>
      </div>
    )
  }

  const role = session.user.role

  const [userStats, setUserStats] = useState<{ rating?: number | null; totalSales?: number; contracts?: number; memberSinceYears?: number | null } | null>(null)
  const [userStatsLoading, setUserStatsLoading] = useState(false)
  const [userStatsError, setUserStatsError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const profileLoadKeyRef = useRef<string | null>(null)

  React.useEffect(() => {
    let active = true
    if (!session.token) {
      profileLoadKeyRef.current = null
      return () => {
        active = false
      }
    }

    const loadKey = session.token
    if (profileLoadKeyRef.current === loadKey) {
      return () => {
        active = false
      }
    }
    profileLoadKeyRef.current = loadKey
    const load = async () => {
      setUserStatsLoading(true)
      setUserStatsError(null)
      try {
        const res = await getUserStats()
        if (active) setUserStats(res.data ?? null)
      } catch (err) {
        console.error('Erreur chargement stats utilisateur', err)
        if (active) setUserStatsError('Impossible de charger les statistiques utilisateur')
      } finally {
        if (active) setUserStatsLoading(false)
      }
    }

    const loadProfileFromDatabase = async () => {
      if (!session.token) return
      setProfileLoading(true)
      try {
        const res = await me()
        const backendUser = res?.data
        if (active && backendUser) {
          const normalizedUser = {
            id: backendUser.id || session.user?.id,
            name: backendUser.name || backendUser.fullName || session.user?.name || 'Utilisateur',
            email: backendUser.email || session.user?.email || '',
            role: backendUser.role || session.user?.role || 'acheteur-particulier',
            phone: backendUser.phone || backendUser.contact || session.user?.phone,
            gender: backendUser.gender || session.user?.gender,
            profileImage: backendUser.profileImage || session.user?.profileImage,
          }
          updateUser(normalizedUser)
          setForm(buildInitialForm(normalizedUser))
        }
      } catch (err) {
        console.error('Erreur chargement profil depuis la base', err)
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    load()
    loadProfileFromDatabase()
    return () => { active = false }
  }, [session.token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        profileImage: profileImagePreview || null,
      }

      if (role === 'agriculteur') {
        payload.farmName = form.farmName
        payload.hectares = form.hectares
        payload.products = form.products
      }

      if (role === 'acheteur-pro') {
        payload.companyName = form.companyName
        payload.siret = form.siret
      }

      const res = await updateProfile(payload)
      const updated = res.data?.user ?? null
      if (updated) {
        updateUser(updated)
        setForm(buildInitialForm(updated))
      }
      setEditing(false)
      alert('Profil mis à jour')
    } catch (err) {
      // minimal feedback
      // eslint-disable-next-line no-console
      console.error(err)
      alert('Impossible de mettre à jour le profil')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/onboarding', { replace: true })
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>
            <i className="fas fa-user-circle" style={{ color: 'var(--primary)' }}></i> Mon profil
          </h1>
          <div className="sub">Gérez vos informations personnelles</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div className="profil-avatar" id="profilAvatar">
            <img src={profileImagePreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=ffffff&color=2F5233`} alt="Photo de profil" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 8, color: 'var(--text-primary)' }} id="profilName">
            {session.user?.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }} id="profilRole">
            {session.user?.role.replace('-', ' ')}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="badge-farmer" id="profilBadge">
              <i className="fas fa-tractor"></i> {session.user?.role === 'agriculteur' ? 'Agriculteur' : session.user?.role}
            </span>
            <span className="badge-premium" style={{ fontSize: 8 }}>
              <i className="fas fa-crown"></i> Premium
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <label className="profile-photo-picker">
              <i className="fas fa-camera" aria-hidden="true"></i> {profileImagePreview ? 'Changer la photo' : 'Ajouter une photo'}
              <input type="file" accept="image/*" onChange={event => {
                const file = event.target.files?.[0]
                if (!file) return
                if (!file.type.startsWith('image/')) {
                  alert('Veuillez sélectionner une image valide.')
                  event.target.value = ''
                  return
                }
                if (file.size > 6 * 1024 * 1024) {
                  alert('La photo doit faire moins de 6 Mo.')
                  event.target.value = ''
                  return
                }
                const reader = new FileReader()
                reader.onload = () => setProfileImagePreview(String(reader.result))
                reader.readAsDataURL(file)
              }} />
            </label>
            {profileImagePreview && <button type="button" className="profile-photo-remove" onClick={() => setProfileImagePreview('')}>Supprimer</button>}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="stats-grid">
            <div className="stat-card"><span className="icon"><i className="fas fa-star"></i></span><div className="number">{userStatsLoading ? '…' : userStats?.rating == null ? '—' : userStats.rating.toFixed(1)}</div><div className="label">Note moyenne</div></div>
            <div className="stat-card"><span className="icon"><i className="fas fa-box"></i></span><div className="number">{userStatsLoading ? '…' : (userStats?.totalSales ?? 0)}</div><div className="label">{role === 'agriculteur' ? 'Offres publiées' : 'Commandes'}</div></div>
            <div className="stat-card"><span className="icon"><i className="fas fa-handshake"></i></span><div className="number">{userStatsLoading ? '…' : (userStats?.contracts ?? 0)}</div><div className="label">Contrats signés</div></div>
            <div className="stat-card"><span className="icon"><i className="fas fa-calendar-alt"></i></span><div className="number">{userStatsLoading ? '…' : userStats?.memberSinceYears == null ? '—' : `${userStats.memberSinceYears} an${userStats.memberSinceYears > 1 ? 's' : ''}`}</div><div className="label">Membre depuis</div></div>
          </div>

          {userStatsError && (
            <div className="alert alert-error" style={{ marginTop: 12 }}>
              <div className="alert-body">
                <div className="alert-title">API indisponible</div>
                <div className="alert-message">Impossible de charger les statistiques utilisateur.</div>
              </div>
            </div>
          )}

            {/* Role-specific summary */}
            {role === 'agriculteur' && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="section-title">Exploitation</div>
                <div className="block-row"><strong>Ferme:</strong><span style={{ marginLeft: 8 }}>{(session.user as any).farmName ?? 'Non renseigné'}</span></div>
                <div className="block-row"><strong>Surface:</strong><span style={{ marginLeft: 8 }}>{(session.user as any).hectares ?? '—'} ha</span></div>
                <div className="block-row" style={{ borderBottom: 'none' }}><strong>Produits:</strong><span style={{ marginLeft: 8 }}>{(session.user as any).products ?? '—'}</span></div>
              </div>
            )}

            {role === 'acheteur-pro' && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="section-title">Entreprise</div>
                <div className="block-row"><strong>Raison sociale:</strong><span style={{ marginLeft: 8 }}>{(session.user as any).companyName ?? 'Non renseigné'}</span></div>
                <div className="block-row" style={{ borderBottom: 'none' }}><strong>SIRET:</strong><span style={{ marginLeft: 8 }}>{(session.user as any).siret ?? '—'}</span></div>
              </div>
            )}

          <div className="card" style={{ marginTop: 12 }}>
            <div className="block-row">
              <i className="fas fa-envelope" style={{ color: 'var(--primary)', width: 24 }}></i>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{session.user?.email ?? 'Non renseigné'}</span>
            </div>
            <div className="block-row">
              <i className="fas fa-phone" style={{ color: 'var(--primary)', width: 24 }}></i>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{session.user?.phone ?? 'Non renseigné'}</span>
            </div>
            <div className="block-row" style={{ borderBottom: 'none' }}>
              <i className="fas fa-venus-mars" style={{ color: 'var(--primary)', width: 24 }}></i>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{session.user?.gender ? (session.user.gender === 'male' ? 'Homme' : session.user.gender === 'female' ? 'Femme' : 'Autre') : 'Non renseigné'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setEditing(true)}><i className="fas fa-edit"></i> Modifier le profil</button>
            <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
          </div>
        </div>
      </div>

      {editing && (
        <div style={{ marginTop: 16 }}>
          <div className="card profile-edit">
            <div className="profile-edit-header">
              <h3>Éditer le profil</h3>
              <p>Mettez à jour vos informations personnelles et vos détails de profil.</p>
            </div>
            <div className="profile-form-grid">
              <div className="profile-field">
                <label>Nom</label>
                <input name="name" value={form.name} onChange={handleChange} className="profile-input" />
              </div>
              <div className="profile-field">
                <label>Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="profile-input" />
              </div>
            </div>
            <div className="profile-form-grid">
              <div className="profile-field">
                <label>Téléphone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="profile-input" />
              </div>
              <div className="profile-field">
                <label>Genre</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="profile-input">
                  <option value="">Non renseigné</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            {role === 'agriculteur' && (
              <div className="profile-form-grid">
                <div className="profile-field">
                  <label>Nom de l'exploitation</label>
                  <input name="farmName" value={form.farmName} onChange={handleChange} className="profile-input" />
                </div>
                <div className="profile-field">
                  <label>Hectares</label>
                  <input name="hectares" value={form.hectares} onChange={handleChange} className="profile-input" />
                </div>
              </div>
            )}

            {role === 'agriculteur' && (
              <div className="profile-field">
                <label>Produits principaux</label>
                <input name="products" value={form.products} onChange={handleChange} className="profile-input" />
              </div>
            )}

            {role === 'acheteur-pro' && (
              <div className="profile-form-grid">
                <div className="profile-field">
                  <label>Raison sociale</label>
                  <input name="companyName" value={form.companyName} onChange={handleChange} className="profile-input" />
                </div>
                <div className="profile-field">
                  <label>SIRET</label>
                  <input name="siret" value={form.siret} onChange={handleChange} className="profile-input" />
                </div>
              </div>
            )}
            <div className="profile-actions">
              <button className="btn-primary" onClick={handleSave}>Enregistrer</button>
              <button className="btn-outline" onClick={() => setEditing(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

    </section>
  )
}
