'use client'

import React from 'react'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
  }

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={24} style={{ color: 'var(--coral)' }} />
      case 'warning':
        return <AlertTriangle size={24} style={{ color: 'var(--amber)' }} />
      case 'info':
        return <Info size={24} style={{ color: 'var(--primary)' }} />
    }
  }

  const getVariantClass = () => {
    switch (variant) {
      case 'danger':
        return 'confirm-dialog-danger'
      case 'warning':
        return 'confirm-dialog-warning'
      case 'info':
        return 'confirm-dialog-info'
    }
  }

  return (
    <div 
      className="modal-overlay modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
    >
      <div className={`confirm-dialog ${getVariantClass()}`}>
        <div className="confirm-dialog-icon">
          {getIcon()}
        </div>
        
        <div className="confirm-dialog-content">
          <h3 className="confirm-dialog-title">{title}</h3>
          <p className="confirm-dialog-message">{message}</p>
        </div>

        <div className="confirm-dialog-actions">
          <button 
            className="outline-button" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            className={variant === 'danger' ? 'danger-button' : 'primary-button'}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: '',
    message: ''
  })
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
    setConfig(options)
    setIsOpen(true)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    resolveRef.current?.(true)
    setIsOpen(false)
  }, [])

  const handleClose = React.useCallback(() => {
    resolveRef.current?.(false)
    setIsOpen(false)
  }, [])

  const dialog = (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...config}
    />
  )

  return { confirm, dialog }
}
