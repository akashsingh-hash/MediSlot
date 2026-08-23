"use client"

import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toast: (props: ToastProps) => void
  toasts: ToastProps[]
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: number })[]>([])
  const [nextId, setNextId] = React.useState(0)

  const toast = React.useCallback((props: ToastProps) => {
    const id = nextId
    setNextId(id + 1)
    setToasts((prev) => [...prev, { ...props, id }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [nextId])

  return (
    <ToastContext.Provider value={{ toast, toasts }}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
          pointerEvents: 'none',
        }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                animation: 'slideIn 0.3s ease-out',
                pointerEvents: 'auto',
                background: t.variant === 'destructive' ? '#ef4444' : '#10b981',
                color: 'white',
              }}
            >
              {t.title && <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t.title}</div>}
              {t.description && <div style={{ fontSize: '14px', opacity: 0.9 }}>{t.description}</div>}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
