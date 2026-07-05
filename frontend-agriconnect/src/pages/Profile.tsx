import React, { useState } from 'react'
import useSession from '../hooks/useSession'
import { updateProfile, getUserStats } from '../services/api'

export default function Profile() {
  const { session, logout, updateUser } = useSession()
  const [editing, setEditing] = useState(false)

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

  const [form, setForm] = useState<any>({
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    phone: session.user.phone ?? '',
    gender: session.user.gender ?? '',
    // role-specific defaults (may be undefined)
    farmName: (session.user as any).farmName ?? '',
    hectares: (session.user as any).hectares ?? '',
    products: (session.user as any).products ?? '',
    companyName: (session.user as any).companyName ?? '',
    siret: (session.user as any).siret ?? '',
  })

  const [userStats, setUserStats] = useState<{ rating?: number; totalSales?: number; contracts?: number; memberSinceYears?: number } | null>(null)
  const [userStatsLoading, setUserStatsLoading] = useState(false)
  const [userStatsError, setUserStatsError] = useState<string | null>(null)

  React.useEffect(() => {
    let active = true
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
    load()
    return () => { active = false }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      // build payload with common fields + role-specific
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
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
      if (updated) updateUser(updated)
      setEditing(false)
      alert('Profil mis à jour')
    } catch (err) {
      // minimal feedback
      // eslint-disable-next-line no-console
      console.error(err)
      alert('Impossible de mettre à jour le profil')
    }
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
            <img src={session.user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=ffffff&color=2F5233` : 'https://images.unsplash.com/photo-1582192730841-2a682d7379f9?w=200&h=200&fit=crop&q=80'} alt="Avatar" />
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
            <button className="btn-small btn-small-outline" onClick={() => alert('Changer rôle')}> <i className="fas fa-exchange-alt"></i> Changer rôle</button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="stats-grid">
            <div className="stat-card"><span className="icon"><i className="fas fa-star"></i></span><div className="number">{userStatsLoading ? '…' : Number(userStats?.rating ?? 1.1).toFixed(1)}</div><div className="label">Note moyenne</div></div>
            <div className="stat-card"><span className="icon"><i className="fas fa-box"></i></span><div className="number">{userStatsLoading ? '…' : (userStats?.totalSales ?? 0)}</div><div className="label">Ventes totales</div></div>
            <div className="stat-card"><span className="icon"><i className="fas fa-handshake"></i></span><div className="number">{userStatsLoading ? '…' : (userStats?.contracts ?? 0)}</div><div className="label">Contrats signés</div></div>
            <div className="stat-card"><span className="icon"><i className="fas fa-calendar-alt"></i></span><div className="number">{userStatsLoading ? '…' : (userStats?.memberSinceYears ? `${userStats.memberSinceYears} ans` : '—')}</div><div className="label">Membre depuis</div></div>
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
              <i className="fas fa-phone" style={{ color: 'var(--primary)', width: 24 }}></i>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{session.user?.phone ?? '+237 699 999 999'}</span>
            </div>
            <div className="block-row">
              <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', width: 24 }}></i>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Dschang, Région Ouest</span>
            </div>
            <div className="block-row" style={{ borderBottom: 'none' }}>
              <i className="fas fa-link" style={{ color: 'var(--primary)', width: 24 }}></i>
              <span style={{ fontSize: 13, color: '#1E3722', fontFamily: 'monospace' }}>0x7a3f...9b2e</span>
              <span className="badge-blockchain" style={{ fontSize: 7 }}>Blockchain</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setEditing(true)}><i className="fas fa-edit"></i> Modifier le profil</button>
            <button className="btn-outline" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={logout}><i className="fas fa-sign-out-alt"></i> Déconnexion</button>
          </div>
        </div>
      </div>

      {editing && (
        <div style={{ marginTop: 16 }}>
          <div className="card">
            <h3>Éditer le profil</h3>
            <div className="grid-2 gap-6" style={{ marginTop: 12 }}>
              <div>
                <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Nom</label>
                <input name="name" value={form.name} onChange={handleChange} className="input mt-3" />
              </div>
              <div>
                <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="input mt-3" />
              </div>
            </div>
            <div className="grid-2 gap-6" style={{ marginTop: 12 }}>
              <div>
                <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Téléphone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input mt-3" />
              </div>
              <div>
                <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Genre</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input mt-3">
                  <option value="">Non renseigné</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            {/* Role-specific edit fields */}
            {role === 'agriculteur' && (
              <div className="grid-2 gap-6" style={{ marginTop: 12 }}>
                <div>
                  <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Nom de l'exploitation</label>
                  <input name="farmName" value={form.farmName} onChange={handleChange} className="input mt-3" />
                </div>
                <div>
                  <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Hectares</label>
                  <input name="hectares" value={form.hectares} onChange={handleChange} className="input mt-3" />
                </div>
              </div>
            )}

            {role === 'agriculteur' && (
              <div style={{ marginTop: 12 }}>
                <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Produits principaux</label>
                <input name="products" value={form.products} onChange={handleChange} className="input mt-3" />
              </div>
            )}

            {role === 'acheteur-pro' && (
              <div className="grid-2 gap-6" style={{ marginTop: 12 }}>
                <div>
                  <label className="text-sm uppercase tracking-[0.35em] text-slate-500">Raison sociale</label>
                  <input name="companyName" value={form.companyName} onChange={handleChange} className="input mt-3" />
                </div>
                <div>
                  <label className="text-sm uppercase tracking-[0.35em] text-slate-500">SIRET</label>
                  <input name="siret" value={form.siret} onChange={handleChange} className="input mt-3" />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-primary" onClick={handleSave}>Enregistrer</button>
              <button className="btn" onClick={() => setEditing(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
