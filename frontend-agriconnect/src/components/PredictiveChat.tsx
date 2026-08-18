import React, { useEffect, useMemo, useRef, useState } from 'react'
import './PredictiveChat.css'
import { composePredictiveReply } from '../services/predictiveAgent'

type Message = {
  id: string
  from: 'user' | 'assistant'
  text: string
  ts: string
}

export default function PredictiveChat({ productName, regionName, autoPrompt }: { productName?: string; regionName?: string; autoPrompt?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      from: 'assistant',
      text: 'Bonjour ! Je suis l’IA prédictive d’AgriConnect. Posez-moi une question sur les prix, les rendements ou les meilleures décisions à prendre.',
      ts: new Date().toISOString(),
    },
  ])
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastPromptRef = useRef<string | null>(null)

  const quickPrompts = useMemo(() => [
    'Quel sera le prix du maïs cette semaine ?',
    'Comment améliorer mon rendement ?',
    'Quel conseil me donnez-vous pour vendre ?',
  ], [])

  const sendMessage = async (value?: string) => {
    const message = (value ?? draft).trim()
    if (!message) return

    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: message,
      ts: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setDraft('')
    setIsTyping(true)

    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        from: 'assistant',
        text: composePredictiveReply(message, {
          productName,
          regionName,
        }),
        ts: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
      inputRef.current?.focus()
    }, 700)
  }

  useEffect(() => {
    if (!autoPrompt || autoPrompt === lastPromptRef.current) return

    lastPromptRef.current = autoPrompt
    void sendMessage(autoPrompt)
  }, [autoPrompt])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <strong>Assistant IA prédictif</strong>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Discutez avec l’IA pour obtenir des conseils de prédiction en temps réel.</div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--success)' }}><i className="fas fa-circle" style={{ fontSize: 8, marginRight: 6 }}></i>En ligne</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {quickPrompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="btn-small btn-small-outline"
            style={{ fontSize: 12 }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(message => (
          <div key={message.id} style={{ display: 'flex', justifyContent: message.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 12px',
                borderRadius: 12,
                background: message.from === 'user' ? 'var(--primary)' : 'var(--bg-input)',
                color: message.from === 'user' ? 'white' : 'var(--text-primary)',
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
                {message.from === 'user' ? 'Vous' : 'IA prédictive'}
              </div>
              <div>{message.text}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-input)' }}>
              L’IA réfléchit à votre question…
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessage()
          }}
          placeholder="Écrivez ici votre question à l’IA..."
          style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-light)' }}
        />
        <button className="btn-primary" onClick={() => sendMessage()}>
          Envoyer
        </button>
      </div>
    </div>
  )
}
