import { useEffect, useState } from 'react'

export type UserRole = 'agriculteur' | 'acheteur-pro' | 'acheteur-particulier'

export interface UserSession {
  token: string | null
  user:
    | {
        id: string
        name: string
        email: string
        role: UserRole
        phone?: string
        gender?: string
      }
    | null
  accountVerified: boolean
}

const STORAGE_KEY = 'agriConnectSession'

let currentSession = loadSession()
const listeners = new Set<() => void>()

function loadSession(): UserSession {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { token: null, user: null, accountVerified: false }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserSession>
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
      accountVerified: Boolean(parsed.accountVerified && parsed.token && parsed.user),
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return { token: null, user: null, accountVerified: false }
  }
}

function saveSession(session: UserSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function applySession(nextSession: UserSession) {
  currentSession = nextSession
  saveSession(nextSession)
  listeners.forEach(listener => listener())
}

export default function useSession() {
  const [session, setSession] = useState<UserSession>(currentSession)

  useEffect(() => {
    const listener = () => setSession(currentSession)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const login = (token: string, user: UserSession['user']) => {
    applySession({ token, user, accountVerified: Boolean(token && user) })
  }

  const logout = () => {
    applySession({ token: null, user: null, accountVerified: false })
  }

  const updateUser = (user: UserSession['user']) => {
    applySession({ ...currentSession, user, accountVerified: Boolean(currentSession.accountVerified || user) })
  }

  const changeRole = (role: UserRole) => {
    if (!currentSession.user) {
      return
    }

    applySession({
      ...currentSession,
      user: { ...currentSession.user, role },
      accountVerified: Boolean(currentSession.accountVerified || currentSession.user),
    })
  }

  return {
    session,
    isAuthenticated: Boolean(session.token && session.user && session.accountVerified),
    login,
    logout,
    updateUser,
    changeRole,
  }
}
