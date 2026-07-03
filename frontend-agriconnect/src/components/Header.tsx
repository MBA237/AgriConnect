import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Accueil', to: '/' },
  { label: 'Rôle', to: '/role-selection' },
  { label: 'Connexion', to: '/auth' },
  { label: 'Profil', to: '/profile' },
]

export default function Header() {
  return (
    <header className="site-header">
      <div className="logo">
        <span className="leaf-mark">A</span>
        AgriConnect
      </div>
      <div className="header-actions">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item${isActive ? ' active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
