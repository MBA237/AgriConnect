import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRole } from '../hooks/useSession'
import Auth from './Auth'
import agriculteurIcon from '../assets/agriculteur.png'
import acheteurIcon from '../assets/acheteur.png'
import particulierIcon from '../assets/particulier.png'
import hero1 from '../assets/hero1.png'
const roles: { icon: string; label: string; value: UserRole; description: string }[] = [
  {
    icon: agriculteurIcon,
    label: 'Agriculteur',
    value: 'agriculteur',
    description: 'Gérez vos parcelles, vos récoltes et vos interventions.',
  },
  {
    icon: acheteurIcon,
    label: 'Acheteur Pro',
    value: 'acheteur-pro',
    description: 'Trouvez des produits agricoles en gros et gérez vos commandes.',
  },
  {
    icon: particulierIcon,
    label: 'Acheteur Particulier',
    value: 'acheteur-particulier',
    description: 'Achetez des produits frais directement auprès des producteurs.',
  },
]

export default function RoleSelection() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleNext = () => {
    if (selectedRole) {
      setShowAuthModal(true)
    }
  }

  return (
    <main className="role-page" style={{ backgroundImage: `url(${hero1})` }}>
      <section className="role-card" >
        <div className="progress-steps">
          <div className="progress-step completed">
            <div className="progress-dot">1</div>
            <div className="progress-label">Intro</div>
          </div>
          <div className="progress-line" />
          <div className="progress-step active">
            <div className="progress-dot">2</div>
            <div className="progress-label">Rôle</div>
          </div>
          <div className="progress-line" />
          <div className="progress-step">
            <div className="progress-dot">3</div>
            <div className="progress-label">Dashboard</div>
          </div>
        </div>

        <div className="page-header">
          <div>
            <p className="eyebrow">QUI ETES-VOUS ?</p>
            <h1>Choisissez votre profil AgriConnect</h1>
          </div>
          <div className="badge badge-particulier">Étape 2</div>
        </div>
        <p className="text-slate-600 role-copy">
          Choisissez le profil le plus adapté à votre activité pour commencer avec un tableau de bord personnalisé.
        </p>

        <div className="role-grid">
          {roles.map(role => {
            const isSelected = selectedRole === role.value
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`card card-clickable text-center ${isSelected ? 'selected-role' : ''}`}
              >
                <div className="role-card-header">
                  <span className="role-icon">
                    <img src={role.icon} alt={role.label} />
                  </span>
                  <h3 className="text-xl font-semibold text-slate-900">{role.label}</h3>
                </div>
                <p className="mt-3 text-slate-600">{role.description}</p>
              </button>
            )
          })}
        </div>

        <div className="role-action">
          <p className="text-slate-600">
            {selectedRole
              ? `Vous avez choisi ${selectedRole.replace('-', ' ')}. Cliquez sur Suivant pour ouvrir l'inscription et choisir de recevoir le code par mail ou par téléphone.`
              : "Sélectionnez un rôle pour continuer vers l'inscription et choisir la réception du code."}
          </p>
          <button
            type="button"
            disabled={!selectedRole}
            onClick={handleNext}
            className="btn-primary mt-6 w-full"
          >
            Suivant
          </button>
        </div>
      </section>
      {showAuthModal && selectedRole ? (
        <div className="auth-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={event => event.stopPropagation()}>
            <Auth role={selectedRole} onClose={() => setShowAuthModal(false)} modal />
          </div>
        </div>
      ) : null}    </main>
  )
}
