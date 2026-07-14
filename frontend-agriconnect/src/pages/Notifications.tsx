import React, { useEffect, useState } from 'react'
import NotificationItem, { Notification } from '../components/NotificationItem'
import { createNotification, getNotifications } from '../services/api'

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

  const handleCreate = async () => {
    try {
      const res = await createNotification({ title: 'Nouvelle alerte', body: 'Test de notification' })
      const n = res.data?.notification
      if (n) setItems(prev => [n, ...prev])
    } catch (err) {
      // ignore
    }
  }

  const toggleRead = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, read: !i.read } : i))

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Notifications</p>
          <h1>Notifications récentes</h1>
        </div>
        <div>
          <button className="btn-primary" onClick={handleCreate}>Créer notification</button>
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
