import React, { createContext, useCallback, useContext, useState } from 'react'
import Alert, { AlertType } from './Alert'
import './ToastProvider.css'

type Toast = { id: string; type: AlertType; title?: string; message: React.ReactNode; timeout?: number }

type ToastContextApi = {
  push: (toast: Omit<Toast, 'id'>) => string
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextApi | null>(null)

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used within ToastProvider')
  return ctx
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    const toast: Toast = { id, ...t }
    setToasts(s => [toast, ...s].slice(0, 4))
    return id
  }, [])

  const remove = useCallback((id: string) => setToasts(s => s.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div className="toast-item" key={t.id}>
            <Alert
              type={t.type}
              title={t.title}
              message={t.message}
              autoClose={t.timeout ?? 4000}
              onClose={() => remove(t.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
