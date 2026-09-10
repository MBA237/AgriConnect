import React, { useEffect, useMemo, useRef, useState } from 'react'
import './PredictiveChat.css'
import { askAgricultureAssistant } from '../services/api'

type SiteSignal = {
  currentPrice?: number
  forecast7?: number
  delta7?: number
  recommendation?: string
  yieldGain?: number
  productionEstimate?: number
  droughtRisk?: number
  weatherLabel?: string
}

type Message = {
  id: string
  from: 'user' | 'assistant'
  text: string
  ts: string
}

export default function PredictiveChat({ productName, regionName, autoPrompt, siteData }: { productName?: string; regionName?: string; autoPrompt?: string; siteData?: SiteSignal }) {
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
  const threadRef = useRef<HTMLDivElement | null>(null)
  const lastPromptRef = useRef<string | null>(null)

  const quickPrompts = useMemo(() => [
    'Quel sera le prix du maïs cette semaine ?',
    'Comment améliorer mon rendement ?',
    'Comment stocker ma récolte ?',
    'Comment vendre au meilleur moment ?',
    'Comment transporter mes produits ?',
    'Quel engrais et quelle irrigation utiliser ?',
    'Comment calculer ma marge avant de vendre ?',
  ], [])

  const sendMessage = async (value?: string) => {
    const message = (value ?? draft).trim()
    if (!message || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      from: 'user',
      text: message,
      ts: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setDraft('')
    setIsTyping(true)

    try {
      const response = await askAgricultureAssistant(message)
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        from: 'assistant',
        text: response.data.answer,
        ts: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
      inputRef.current?.focus()
    } catch (error: any) {
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant-error`,
        from: 'assistant',
        text: error?.response?.data?.error || 'Le service IA est indisponible. Configurez le fournisseur LLM dans le backend.',
        ts: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!autoPrompt || autoPrompt === lastPromptRef.current) return

    lastPromptRef.current = autoPrompt
    void sendMessage(autoPrompt)
  }, [autoPrompt])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="card predictive-chat-shell">
      <div className="predictive-chat-header">
        <div>
          <strong>Assistant IA prédictif</strong>
          <div className="predictive-chat-subtitle">Conseils agricoles contextualisés pour {productName || 'votre exploitation'}{regionName ? ` · ${regionName}` : ''}.</div>
        </div>
        <span className={`predictive-chat-status ${isTyping ? 'is-busy' : ''}`}><i className="fas fa-circle" />{isTyping ? 'Analyse...' : 'Prêt'}</span>
      </div>

      <div className="predictive-chat-prompts">
        {quickPrompts.map(prompt => (
          <button
            key={prompt}
            type="button"
            onClick={() => void sendMessage(prompt)}
            className="predictive-chat-prompt"
            disabled={isTyping}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div ref={threadRef} className="predictive-chat-thread">
        {messages.map(message => (
          <div key={message.id} className={`predictive-chat-row ${message.from}`}>
            <div className={`predictive-chat-message ${message.from}`}>
              <div className="predictive-chat-author">{message.from === 'user' ? 'Vous' : 'IA prédictive'}</div>
              <div>{message.text}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="predictive-chat-row assistant">
            <div className="predictive-chat-message assistant predictive-chat-typing">
              <span className="predictive-chat-dots"><i /><i /><i /></span>
              L’IA analyse votre question...
            </div>
          </div>
        )}
      </div>

      <div className="predictive-chat-compose">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') void sendMessage()
          }}
          placeholder="Posez votre question..."
          aria-label="Question pour l’assistant prédictif"
          disabled={isTyping}
        />
        <button className="btn-primary" type="button" onClick={() => void sendMessage()} disabled={isTyping || !draft.trim()}>
          {isTyping ? '...' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}
