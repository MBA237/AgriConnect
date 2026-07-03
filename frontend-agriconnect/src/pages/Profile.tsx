import React from 'react'
import useSession from '../hooks/useSession'

export default function Profile() {
  const { session, logout } = useSession()

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

  return (
    <section className="space-y-8">
      <div className="card">
        <div className="page-header">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Profil</p>
            <h1>Informations du compte</h1>
          </div>
        </div>

        <div className="grid-2 gap-6">
          <div className="card">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Nom</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{session.user.name}</p>
          </div>
          <div className="card">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Rôle</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{session.user.role.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="card">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Email</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">{session.user.email}</p>
        </div>

        <button type="button" onClick={logout} className="btn-secondary">
          Se déconnecter
        </button>
      </div>
    </section>
  )
}
