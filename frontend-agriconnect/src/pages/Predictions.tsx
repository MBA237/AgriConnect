import React from 'react'
import { Link } from 'react-router-dom'

export default function Predictions() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Prédictions IA</h1>
          <div className="sub">Accédez aux prévisions de prix, de rendement et aux recommandations.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Link to="/predictions/price" className="card" style={{ padding: 24, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Prix</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Prévision des prix</div>
          </div>
          <span className="btn-small btn-small-outline">Voir</span>
        </Link>

        <Link to="/predictions/yield" className="card" style={{ padding: 24, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Rendement</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Prévision de récoltes</div>
          </div>
          <span className="btn-small btn-small-outline">Voir</span>
        </Link>

        <Link to="/predictions/recommendations" className="card" style={{ padding: 24, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Conseils</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>Recommandations IA</div>
          </div>
          <span className="btn-small btn-small-outline">Voir</span>
        </Link>
      </div>
    </section>
  )
}
