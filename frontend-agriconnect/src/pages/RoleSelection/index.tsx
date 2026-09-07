import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRole } from '../../hooks/useSession'
import agriculteurIcon from '../../assets/agriculteur.png'
import acheteurIcon from '../../assets/acheteur.png'
import particulierIcon from '../../assets/particulier.png'
import hero1 from '../../assets/hero1.png'
import './RoleSelection.css';

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

type RoleSelectionProps = {
  modal?: boolean
  onClose?: () => void
}

export default function RoleSelection({ modal, onClose }: RoleSelectionProps = {}) {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  useEffect(() => {
    if (modal) {
      document.body.classList.add('overlay-open')
    } else {
      document.body.classList.remove('overlay-open')
    }
    return () => {
      document.body.classList.remove('overlay-open')
    }
  }, [modal])

  const handleCreateAccount = () => {
    if (!selectedRole) return
    navigate(`/auth?mode=register&role=${selectedRole}`)
  }

  const handleLogin = () => {
    navigate(`/auth?mode=login&role=${selectedRole || 'acheteur-particulier'}`)
  }

  const roleContent = (
    <section className={`role-card role-shell${modal ? ' modal-card' : ''}`}>
      {onClose ? (
              <button type="button" className="role-close-button" onClick={onClose} aria-label="Fermer la fenêtre de sélection du rôle" title="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
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
            <div className="progress-label">Tableau</div>
          </div>
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
                aria-pressed={isSelected}
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
          <div className="role-action-buttons flex gap-3 mt-6">
            <button type="button" disabled={!selectedRole} onClick={handleCreateAccount} className="btn-primary w-full md:w-auto">
              Créer un compte
            </button>
            <button type="button" onClick={handleLogin} className="btn-outline w-full md:w-auto">
              Je me connecte
            </button>
          </div>
        </div>
      </section>
    )

  if (modal) {
    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal role-dialog" onClick={event => event.stopPropagation()}>
          {roleContent}
        </div>
      </div>
    )
  }

  return (
    <main className="role-page" style={{ backgroundImage: `url(${hero1})` }}>
      {roleContent}
    </main>
  )
}
