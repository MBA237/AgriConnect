import React, { useEffect, useRef, useState } from 'react'
import { getChatMessages, sendChatMessage } from '../services/api'

export default function Chat({ room = 'global' }: { room?: string }) {
  const [messages, setMessages] = useState<Array<{ id: string; from: string; text: string; ts?: string }>>([])
  const [text, setText] = useState('')
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed'>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    const loadHistory = async () => {
      try {
        const res = await getChatMessages({ room })
        if (mounted) setMessages(Array.isArray(res.data?.messages) ? res.data.messages : [])
      } catch (err) {
        // ignore
      }
    }
    loadHistory()

    const wsUrl = import.meta.env.VITE_CHAT_WS_URL ?? 'ws://localhost/chat/messages'
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => setWsStatus('connected')
      ws.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data)
          if (d?.type === 'chat_message') {
            setMessages(prev => [...prev, d.message])
          }
        } catch {}
      }
      ws.onclose = () => setWsStatus('closed')
    } catch (err) {
      setWsStatus('closed')
    }

    return () => { mounted = false; if (wsRef.current) wsRef.current.close() }
  }, [room])

  useEffect(() => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const msg = { id: Date.now().toString(), from: 'me', text: text.trim(), ts: new Date().toISOString() }
    // optimistic
    setMessages(prev => [...prev, msg])
    setText('')
    try {
      await sendChatMessage({ room, text: msg.text })
    } catch (err) {
      // ignore for now
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 360 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Chat</strong>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{wsStatus === 'connected' ? 'En direct' : wsStatus === 'connecting' ? 'Connexion...' : 'Déconnecté'}</span>
      </div>
      <div ref={containerRef} style={{ overflowY: 'auto', marginTop: 8, flex: 1 }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.from?.charAt(0)?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{m.from}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{m.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.ts ? new Date(m.ts).toLocaleTimeString('fr-FR') : ''}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Écrire un message..." style={{ flex: 1, padding: 8, borderRadius: 10, border: '1px solid var(--border-light)' }} />
        <button className="btn-primary" onClick={handleSend}>Envoyer</button>
      </div>
    </div>
  )
}
