import React from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import hero1 from '../assets/hero1.png'
import logo from '../assets/AgriConnect.png'

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <main className="landing-page">
      <section className="landing-hero">
        {/* Positioned background image. Recommended export size: 1440×720 px */}
        <img src={hero1} alt="AgriConnect hero background" className="hero-bg" width={1440} height={720} />
        <div className="landing-copy">
          <p className="eyebrow"> <span className='point'>.</span>AgriConnect</p>
          <br/>
          <img src={logo} alt="AgriConnect Logo" className="landing-logo" />
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
