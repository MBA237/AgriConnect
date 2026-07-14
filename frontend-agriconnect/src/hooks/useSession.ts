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
    const hasActiveSession = Boolean(parsed.token && parsed.user)

    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
      accountVerified: parsed.accountVerified ?? hasActiveSession,
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

function hasActiveSession(session: Partial<UserSession> | null | undefined) {
  return Boolean(session?.token && session?.user)
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
    applySession({
      ...currentSession,
      user,
      accountVerified: Boolean(currentSession.token && user),
    })
  }

  const changeRole = (role: UserRole) => {
    if (!currentSession.user) {
      return
    }

    applySession({
      ...currentSession,
      user: { ...currentSession.user, role },
      accountVerified: Boolean(currentSession.token && currentSession.user),
    })
  }

  return {
    session,
    isAuthenticated: hasActiveSession(session),
    login,
    logout,
    updateUser,
    changeRole,
  }
}
