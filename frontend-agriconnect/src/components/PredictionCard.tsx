import React from 'react'

type Props = {
  title: string
  value: string | number
  change?: string | number
  note?: string
}

export default function PredictionCard({ title, value, change, note }: Props) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        {change !== undefined && (
          <div style={{ fontSize: 12, fontWeight: 800, color: String(change).startsWith('-') ? 'var(--danger)' : 'var(--success)' }}>
            {change}
          </div>
        )}
      </div>
      <div style={{ marginTop: 12, fontSize: 26, fontWeight: 900 }}>{value}</div>
      {note && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{note}</div>}
    </div>
  )
}
