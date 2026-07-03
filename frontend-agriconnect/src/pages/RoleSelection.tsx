import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRole } from '../hooks/useSession'

const roles: { icon: string; label: string; value: UserRole; description: string }[] = [
  {
    icon: '🚜',
    label: 'Agriculteur',
    value: 'agriculteur',
    description: 'Gérez vos parcelles, vos récoltes et vos interventions.',
  },
  {
    icon: '📦',
    label: 'Acheteur Pro',
    value: 'acheteur-pro',
    description: 'Trouvez des produits agricoles en gros et gérez vos commandes.',
  },
  {
    icon: '🛒',
    label: 'Acheteur Particulier',
    value: 'acheteur-particulier',
    description: 'Achetez des produits frais directement auprès des producteurs.',
  },
]

export default function RoleSelection() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleNext = () => {
    if (selectedRole) {
      navigate('/auth?role=' + selectedRole)
    }
  }

  return (
    <main className="role-page">
      <section className="role-card">
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
            <p className="eyebrow">Sélection du rôle</p>
            <h1>Choisissez votre rôle</h1>
          </div>
          <div className="badge badge-particulier">Étape 2</div>
        </div>
        <p className="text-slate-600">
          Sélectionnez le profil qui correspond à votre utilisation d’AgriConnect.
        </p>

        <div className="role-grid">
          {roles.map(role => (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelectedRole(role.value)}
              className={`card card-clickable text-left ${
                selectedRole === role.value ? 'selected-role' : ''
              }`}
            >
              <div className="role-card-header">
                <span className="role-icon" aria-hidden="true">{role.icon}</span>
                <h3 className="text-xl font-semibold text-slate-900">{role.label}</h3>
              </div>
              <p className="mt-3 text-slate-600">{role.description}</p>
            </button>
          ))}
        </div>

        <div className="role-action">
          <p className="text-slate-600">
            {selectedRole
              ? `Vous avez choisi ${selectedRole.replace('-', ' ')}. Cliquez sur Suivant pour ouvrir la connexion ou l'inscription.`
              : 'Sélectionnez un rôle pour continuer vers la connexion.'}
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
    </main>
  )
}
