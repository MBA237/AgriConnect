import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useSession from '../hooks/useSession'

export default function Header() {
  const { session } = useSession()
  const navigate = useNavigate()

  const THEME_KEY = 'agriTheme'
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem(THEME_KEY) ?? 'system'
    } catch (e) {
      return 'system'
    }
  })

  useEffect(() => {
    let mql: MediaQueryList | null = null

    const apply = (t: string) => {
      if (t === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
      } else if (t === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        // system
        mql = window.matchMedia('(prefers-color-scheme: dark)')
        const systemIsDark = mql.matches
        document.documentElement.setAttribute('data-theme', systemIsDark ? 'dark' : 'light')
      }
    }

    apply(theme)

    if (theme === 'system') {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      // older browsers use addListener
      if (mql.addEventListener) mql.addEventListener('change', listener)
      else if (mql.addListener) mql.addListener(listener)

      return () => {
        if (!mql) return
        if (mql.removeEventListener) mql.removeEventListener('change', listener)
        else if (mql.removeListener) mql.removeListener(listener)
      }
    }

    return () => {}
  }, [theme])

  const setAndPersist = (t: string) => {
    try { localStorage.setItem(THEME_KEY, t) } catch (e) {}
    setTheme(t)
  }

  return (
    <header className="site-header">
      <div className="logo">
        <span className="leaf-mark"><i className="fas fa-leaf"></i></span>
        Agri<span>Connect</span>
        <span className="badge-web">Web</span>
      </div>

      <div className="header-actions">
        <div className="theme-selector" id="themeSelector" role="tablist" aria-label="Thème">
          <button
            className={theme === 'light' ? 'active' : ''}
            data-theme="light"
            title="Thème clair"
            aria-pressed={theme === 'light'}
            onClick={() => setAndPersist('light')}
          >
            <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>Clair</span>
          </button>

          <button
            className={theme === 'dark' ? 'active' : ''}
            data-theme="dark"
            title="Thème sombre"
            aria-pressed={theme === 'dark'}
            onClick={() => setAndPersist('dark')}
          >
            <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.64 13.28A9 9 0 1110.72 2.36 7 7 0 0021.64 13.28z" />
            </svg>
            <span>Sombre</span>
          </button>

          <button
            className={theme === 'system' ? 'active' : ''}
            data-theme="system"
            title="Thème système"
            aria-pressed={theme === 'system'}
            onClick={() => setAndPersist('system')}
          >
            <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5h18v11H3zM21 3H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
            <span>Système</span>
          </button>
        </div>

        <button className="notif-btn" onClick={() => alert('📬 Vous avez 5 notifications')}>
          <svg className="notif-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          <span className="badge">5</span>
        </button>

        <div className="user-badge" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="avatar" id="headerAvatar"><img src={session.user?.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=ffffff&color=2F5233` : '/favicon.svg'} alt="Avatar" /></div>
          <div className="user-info">
            <span className="name" id="headerName">{session.user?.name ?? 'Vous'}</span>
            <span className="role" id="headerRole">{session.user?.role ?? ''}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
