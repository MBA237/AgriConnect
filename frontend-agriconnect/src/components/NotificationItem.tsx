import React from 'react'

export type Notification = {
  id: string
  title: string
  body?: string
  date?: string
  read?: boolean
}

export default function NotificationItem({ n, onToggleRead }: { n: Notification; onToggleRead?: (id: string) => void }) {
  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div>
        <div style={{ fontWeight: n.read ? 600 : 800 }}>{n.title}</div>
        {n.body ? <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>{n.body}</div> : null}
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{n.date ? new Date(n.date).toLocaleString('fr-FR') : ''}</div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <button className="btn-small btn-small-outline" onClick={() => onToggleRead && onToggleRead(n.id)}>{n.read ? 'Marquer non lu' : 'Marquer lu'}</button>
      </div>
    </div>
  )
}
