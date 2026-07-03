import React from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero.png'

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <main className="landing-page">
      <section className="landing-hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="landing-copy">
          <p className="eyebrow">AgriConnect</p>
          <h1 className="landing-title">
            Une plateforme professionnelle pour relier producteurs et acheteurs.
          </h1>
          <p className="landing-description">
            Un parcours simple et centré sur votre rôle, du lancement à la connexion.
          </p>
          <button
            type="button"
            onClick={() => navigate('/role-selection')}
            className="btn-primary landing-cta"
          >
            Suivant
          </button>
        </div>
      </section>
    </main>
  )
}
