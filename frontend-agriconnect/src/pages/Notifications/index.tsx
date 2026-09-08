import React, { useEffect, useState } from 'react'
import NotificationItem, { Notification } from '../../components/NotificationItem'
import { getNotifications, markNotificationRead } from '../../services/api'
import './Notifications.css';

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await getNotifications()
        if (mounted) setItems(Array.isArray(res.data?.notifications) ? res.data.notifications : [])
      } catch (err) {
        if (mounted) setError('Impossible de charger les notifications')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const toggleRead = async (id: string) => {
    const item = items.find(notification => notification.id === id)
    if (!item) return
    const nextRead = !item.read
    try {
      await markNotificationRead(id, nextRead)
      setItems(prev => prev.map(i => i.id === id ? { ...i, read: nextRead } : i))
    } catch (err) {
      setError('Impossible de mettre à jour la notification')
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Notifications</p>
          <h1>Notifications récentes</h1>
        </div>
      </div>

      <div className="card">
        {loading ? <div>Chargement...</div> : error ? <div className="alert alert-error"><div className="alert-body"><div className="alert-message">{error}</div></div></div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map(it => <NotificationItem key={it.id} n={it} onToggleRead={toggleRead} />)}
          </div>
        )}
      </div>
    </section>
  )
}
