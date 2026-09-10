import React, { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import Chat from './Chat'
import './FloatingChat.css'

type ChatMessage = {
  id: string
  from: 'user' | 'assistant'
  text: string
  ts: string
}

export default function FloatingChat() {
  const [aiOpen, setAiOpen] = useState(false)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      from: 'assistant',
      text: 'Bonjour ! Je peux répondre à partir des données de AgriConnect : produits, contrats, prix et stocks actuels.',
      ts: new Date().toISOString(),
    },
  ])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (aiOpen) inputRef.current?.focus()
  }, [aiOpen])

  const openAiPanel = () => {
    setAiOpen(previous => !previous)
    setMessagesOpen(false)
  }

  const openMessagesPanel = () => {
    setMessagesOpen(previous => !previous)
    setAiOpen(false)
  }

  const sendMessage = async (value?: string) => {
    const text = (value ?? draft).trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text,
      ts: new Date().toISOString(),
    }

    setMessages(previous => [...previous, userMessage])
    setDraft('')
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/ai/chat', { question: text })
      const answer = response?.data?.answer || 'Je n’ai pas de réponse fiable pour cette question.'
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        from: 'assistant',
        text: answer,
        ts: new Date().toISOString(),
      }
      setMessages(previous => [...previous, assistantMessage])
    } catch (err: any) {
      console.error('Floating AI error:', err)
      const serverMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Le service IA n’a pas répondu. Vérifiez la connexion au backend.'
      setError(serverMessage)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="floating-chat">
      {aiOpen ? (
        <section className="floating-chat-popup floating-ai-popup" aria-label="Assistant IA AgriConnect">
          <header className="floating-chat-header">
            <div>
              <span className="floating-chat-kicker">Assistant IA</span>
              <strong>AgriConnect AI</strong>
            </div>
            <button type="button" className="floating-chat-close" onClick={() => setAiOpen(false)} aria-label="Fermer l’assistant">×</button>
          </header>

          <div className="floating-chat-body">
            <div className="assistant-thread">
              {messages.map(message => (
                <div key={message.id} className={`assistant-bubble ${message.from}`}>
                  <span>{message.text}</span>
                  {message.ts ? <small>{new Date(message.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small> : null}
                </div>
              ))}
              {loading ? <div className="assistant-bubble assistant"><span>Je consulte les données de la plateforme…</span></div> : null}
            </div>

            <div className="chat-compose">
              <input
                ref={inputRef}
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') void sendMessage()
                }}
                placeholder="Posez une question à l’IA..."
                aria-label="Question pour l’assistant IA"
              />
              <button type="button" onClick={() => void sendMessage()} disabled={loading || !draft.trim()} aria-label="Envoyer la question">
                {loading ? '…' : '→'}
              </button>
            </div>
            {error ? <p className="chat-error">{error}</p> : null}
          </div>
        </section>
      ) : null}

      {messagesOpen ? (
        <section className="floating-chat-popup floating-message-popup" aria-label="Messages AgriConnect">
          <header className="floating-chat-header floating-message-header">
            <div>
              <span className="floating-chat-kicker">Messages</span>
              <strong>Conversations</strong>
            </div>
            <button type="button" className="floating-chat-close" onClick={() => setMessagesOpen(false)} aria-label="Fermer les messages">×</button>
          </header>
          <div className="floating-message-body">
            <Chat room="global" />
          </div>
        </section>
      ) : null}

      <div className="floating-chat-actions">
        <button type="button" className="floating-chat-trigger floating-message-trigger" onClick={openMessagesPanel} aria-label="Ouvrir les messages" aria-expanded={messagesOpen}>
          <i className="floating-chat-icon fas fa-comment-dots" aria-hidden="true"></i>
        </button>

        <button type="button" className="floating-chat-trigger" onClick={openAiPanel} aria-label="Ouvrir l’assistant IA" aria-expanded={aiOpen}>
          <i className="floating-chat-icon fas fa-robot" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  )
}
