import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import hero1 from '../../assets/hero1.png'
import logo from '../../assets/AgriConnect.png'
import useSession from '../../hooks/useSession'
import './Onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSession()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <img src={hero1} alt="AgriConnect hero background" className="hero-bg" width={1440} height={720} />
        <div className="landing-copy">
          <p className="eyebrow"><span className="point"></span>AgriConnect</p>
          <br />
          <img src={logo} alt="AgriConnect Logo" className="landing-logo" />
          <h1 className="landing-title">
            Une plateforme professionnelle pour relier producteurs et acheteurs.
          </h1>
          <p className="landing-description">
            Un parcours simple et centré sur votre rôle, du lancement à la connexion.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/role-selection')} className="btn-primary landing-cta">
              Créer un compte
            </button>
            <button type="button" onClick={() => navigate('/auth?mode=login')} className="btn-outline landing-cta">
              Je me connecte
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
