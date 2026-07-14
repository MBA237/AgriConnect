import React from 'react'

export default function StatCard({ title, value, delta, icon }: { title: string; value: string | number; delta?: number; icon?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon || '📊'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
        {typeof delta === 'number' ? <div style={{ fontSize: 12, color: delta >= 0 ? 'var(--green)' : 'var(--red)' }}>{delta >= 0 ? `+${delta}%` : `${delta}%`}</div> : null}
      </div>
    </div>
  )
}
