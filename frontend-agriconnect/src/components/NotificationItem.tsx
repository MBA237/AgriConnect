import React from 'react'
import './NotificationItem.css'

export type Notification = {
  id: string
  title: string
  body?: string
  kind?: 'publication' | 'order' | 'message' | 'general' | string
  targetId?: string | null
  date?: string
  read?: boolean
}

export default function NotificationItem({ n, onToggleRead, onOpen }: { n: Notification; onToggleRead?: (id: string) => void; onOpen?: (notification: Notification) => void }) {
  return (
    <div className="card notification-card" role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onClick={() => onOpen?.(n)} onKeyDown={event => { if (event.key === 'Enter') onOpen?.(n) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: onOpen ? 'pointer' : undefined }}>
      <div>
        <div style={{ fontWeight: n.read ? 600 : 800 }}>{n.title}</div>
        {n.body ? <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>{n.body}</div> : null}
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{n.date || (n as Notification & { createdAt?: string }).createdAt ? new Date(n.date || (n as Notification & { createdAt: string }).createdAt).toLocaleString('fr-FR') : ''}</div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <button className="btn-small btn-small-outline" onClick={event => { event.stopPropagation(); onToggleRead?.(n.id) }}>{n.read ? 'Marquer non lu' : 'Marquer lu'}</button>
      </div>
    </div>
  )
}
