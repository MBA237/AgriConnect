import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-text">© {new Date().getFullYear()} AgriConnect</div>
      <div className="footer-links">
        <a href="#">Mentions légales</a>
        <a href="#">Contact</a>
      </div>
    </footer>
  )
}
