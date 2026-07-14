import React from 'react'

export default function InvestmentProgress({ raised, goal }: { raised: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800 }}>Progression</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{pct}%</div>
      </div>
      <div style={{ marginTop: 8, height: 12, background: 'rgba(0,0,0,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,var(--primary),var(--primary-light))' }} />
      </div>
      <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{raised.toLocaleString('fr-FR')} FCFA collectés sur {goal.toLocaleString('fr-FR')} FCFA</div>
    </div>
  )
}
