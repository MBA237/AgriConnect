import React from 'react'
import './Sidebar.css'
import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Accueil', to: '/home', description: 'Votre tableau de bord' },
  { label: 'Catalogue', to: '/catalog', description: 'Explorer les produits' },
  { label: 'Panier', to: '/cart', description: 'Voir votre panier' },
  { label: 'Marché Dynamique', to: '/market', description: 'Voir les prix en direct' },
  { label: 'Contrats', to: '/contracts', description: 'Gérer les contrats garantis' },
  { label: 'Traçabilité', to: '/traceability', description: 'Suivre les lots via QR code' },
  { label: 'Financement', to: '/crowdfunding', description: 'Soutenir des projets agricoles' },
  { label: 'Notifications', to: '/notifications', description: 'Consulter les alertes' },
  { label: 'Chat', to: '/chat', description: 'Messagerie et assistance' },
  { label: 'Prédictions', to: '/predictions', description: 'Consulter les prévisions IA' },
  { label: 'Mes commandes', to: '/orders/my', description: 'Suivre vos commandes' },
  { label: 'Profil', to: '/profile', description: 'Gérer votre compte' },
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
            <span className="sidebar-link-title">{link.label}</span>
            <span className="sidebar-link-desc">{link.description}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
