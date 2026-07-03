import React from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Tableau de bord', to: '/' },
  { label: 'Onboarding', to: '/onboarding' },
  { label: 'Choix du rôle', to: '/role-selection' },
  { label: 'Connexion', to: '/auth' },
  { label: 'Profil', to: '/profile' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="nav-section">Navigation</div>
      <div className="space-y-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-item${isActive ? ' active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
