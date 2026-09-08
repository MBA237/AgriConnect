import React, { useEffect, useState } from 'react'
import { getChatConversations, getChatMessages, sendChatMessage } from '../services/api'
import './FloatingChat.css'

type ChatUser = {
  id: string
  fullName?: string
  email?: string
  role?: string
  profileImage?: string
}

type ChatMessage = {
  id: string
  from: string
  text: string
  ts?: string
}

type Conversation = {
  user: ChatUser
  lastMessage: ChatMessage
}

function userName(user: ChatUser) {
  return user.fullName || user.email || 'Utilisateur'
}

function initials(user: ChatUser) {
  return userName(user).slice(0, 2).toUpperCase()
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadConversations = async () => {
    try {
      const response = await getChatConversations()
      setConversations(Array.isArray(response.data?.conversations) ? response.data.conversations : [])
      setError('')
    } catch {
      setError('Impossible de charger les discussions.')
    }
  }

  useEffect(() => {
    if (!open) return
    loadConversations()
    const timer = window.setInterval(loadConversations, 15000)
    return () => window.clearInterval(timer)
  }, [open])

  useEffect(() => {
    if (!selectedUser) return
    let active = true
    setLoading(true)
    getChatMessages(selectedUser.id)
      .then(response => {
        if (active) setMessages(Array.isArray(response.data?.messages) ? response.data.messages : [])
      })
      .catch(() => {
        if (active) setError('Impossible de charger cette discussion.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [selectedUser])

  const selectConversation = (conversation: Conversation) => {
    setSelectedUser(conversation.user)
    setMessages([])
    setError('')
  }

  const handleSend = async () => {
    if (!selectedUser || !text.trim() || sending) return
    const messageText = text.trim()
    setSending(true)
    setError('')
    try {
      const response = await sendChatMessage({ receiverId: selectedUser.id, text: messageText })
      const message = response.data?.message
      if (message) setMessages(previous => [...previous, message])
      setText('')
      await loadConversations()
    } catch {
      setError('Impossible d’envoyer le message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="floating-chat">
      {open ? (
        <section className="floating-chat-popup" aria-label="Discussions">
          <header className="floating-chat-header">
            <div>
              <span className="floating-chat-kicker">Messagerie</span>
              <strong>Vos discussions</strong>
            </div>
            <button type="button" className="floating-chat-close" onClick={() => setOpen(false)} aria-label="Fermer la messagerie">×</button>
          </header>

          <div className="floating-chat-body">
            {!selectedUser ? (
              <div className="conversation-list">
                {conversations.length === 0 && !error ? <p className="chat-empty">Aucune discussion pour le moment.</p> : null}
                {conversations.map(conversation => (
                  <button type="button" className="conversation-row" key={conversation.user.id} onClick={() => selectConversation(conversation)}>
                    {conversation.user.profileImage ? <img src={conversation.user.profileImage} alt="" className="conversation-avatar" /> : <span className="conversation-avatar conversation-initials">{initials(conversation.user)}</span>}
                    <span className="conversation-copy">
                      <strong>{userName(conversation.user)}</strong>
                      <span>{conversation.lastMessage.text}</span>
                    </span>
                    <span className="conversation-arrow">›</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="chat-thread">
                <button type="button" className="chat-back" onClick={() => setSelectedUser(null)}>← Toutes les discussions</button>
                <div className="chat-contact"><strong>{userName(selectedUser)}</strong><span>{selectedUser.role || 'Utilisateur'}</span></div>
                <div className="chat-thread-messages">
                  {loading ? <p className="chat-empty">Chargement...</p> : null}
                  {!loading && messages.length === 0 ? <p className="chat-empty">Commencez la discussion.</p> : null}
                  {messages.map(message => (
                    <div key={message.id} className={`chat-bubble ${message.from === 'me' ? 'outgoing' : 'incoming'}`}>
                      <span>{message.text}</span>
                      {message.ts ? <small>{new Date(message.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small> : null}
                    </div>
                  ))}
                </div>
                <div className="chat-compose">
                  <input value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') handleSend() }} placeholder="Écrire une réponse..." aria-label="Votre message" />
                  <button type="button" onClick={handleSend} disabled={sending || !text.trim()} aria-label="Envoyer">{sending ? '...' : '→'}</button>
                </div>
              </div>
            )}
            {error ? <p className="chat-error">{error}</p> : null}
          </div>
        </section>
      ) : null}

      <button type="button" className="floating-chat-trigger" onClick={() => setOpen(previous => !previous)} aria-label="Ouvrir les discussions" aria-expanded={open}>
        <i className="floating-chat-icon fas fa-comments" aria-hidden="true"></i>
        {conversations.length > 0 ? <span className="floating-chat-count">{conversations.length > 99 ? '99+' : conversations.length}</span> : null}
      </button>
    </div>
  )
}
