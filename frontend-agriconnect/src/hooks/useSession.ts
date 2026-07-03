import { useEffect, useState } from 'react'

export type UserRole = 'agriculteur' | 'acheteur-pro' | 'acheteur-particulier'

export interface UserSession {
  token: string | null
  user: { id: string; name: string; email: string; role: UserRole } | null
}

const STORAGE_KEY = 'agriConnectSession'

function loadSession(): UserSession {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { token: null, user: null }
  }

  try {
    return JSON.parse(raw) as UserSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return { token: null, user: null }
  }
}

function saveSession(session: UserSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export default function useSession() {
  const [session, setSession] = useState<UserSession>(() => loadSession())

  useEffect(() => {
    saveSession(session)
  }, [session])

  const login = (token: string, user: UserSession['user']) => {
    setSession({ token, user })
  }

  const logout = () => {
    setSession({ token: null, user: null })
  }

  const updateUser = (user: UserSession['user']) => {
    setSession(current => ({ ...current, user }))
  }

  return {
    session,
    isAuthenticated: Boolean(session.token),
    login,
    logout,
    updateUser,
  }
}
