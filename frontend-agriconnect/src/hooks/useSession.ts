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
        profileImage?: string
      }
    | null
  accountVerified: boolean
}

const STORAGE_KEY = 'agriConnectSession'

function normalizeRole(role: unknown): UserRole {
  switch (role) {
    case 'FARMER':
    case 'agriculteur':
      return 'agriculteur'
    case 'BUYER_PRO':
    case 'acheteur-pro':
      return 'acheteur-pro'
    default:
      return 'acheteur-particulier'
  }
}

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
      user: parsed.user
        ? { ...parsed.user, role: normalizeRole(parsed.user.role) }
        : null,
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
    applySession({
      token,
      user: user ? { ...user, role: normalizeRole(user.role) } : null,
      accountVerified: Boolean(token && user),
    })
  }

  const logout = () => {
    localStorage.setItem('agriTheme', 'light')
    document.documentElement.setAttribute('data-theme', 'light')
    applySession({ token: null, user: null, accountVerified: false })
  }

  const updateUser = (user: UserSession['user']) => {
    applySession({
      ...currentSession,
      user,
      accountVerified: Boolean(currentSession.token && user),
    })
  }

  return {
    session,
    isAuthenticated: hasActiveSession(session),
    login,
    logout,
    updateUser,
  }
}
