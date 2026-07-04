import React, { useEffect } from 'react'

export type AlertType = 'success' | 'error' | 'info' | 'warning'

type AlertProps = {
  type?: AlertType
  title?: string
  message: React.ReactNode
  onClose?: () => void
  autoClose?: number // ms, if provided will auto dismiss
  className?: string
}

export default function Alert({ type = 'info', title, message, onClose, autoClose, className }: AlertProps) {
  useEffect(() => {
    if (!autoClose) return
    const id = setTimeout(() => onClose && onClose(), autoClose)
    return () => clearTimeout(id)
  }, [autoClose, onClose])

  return (
    <div className={`alert alert-${type} ${className ?? ''}`} role="alert" aria-live="polite">
      <div className="alert-left">
        <span className="alert-icon" aria-hidden="true">
          {type === 'success' && (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
          {type === 'error' && (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
          {type === 'warning' && (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
          {type === 'info' && (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 16v-4M12 8h.01M21 12A9 9 0 1112 3a9 9 0 019 9z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </span>
      </div>

      <div className="alert-body">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{message}</div>
      </div>

      <button className="alert-close" aria-label="Fermer" onClick={() => onClose && onClose()}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  )
}
