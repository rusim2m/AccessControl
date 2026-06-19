import React, { useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ title = 'Confirm Action', message, onConfirm, onCancel, confirmLabel = 'Delete', confirmVariant = 'danger', loading = false }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    },
    [onCancel, onConfirm]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel()
  }

  const confirmClass =
    confirmVariant === 'danger'
      ? 'btn-danger'
      : 'btn-primary'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={onCancel} className="btn-secondary btn-sm" disabled={loading}>
              Cancel
            </button>
            <button onClick={onConfirm} className={`${confirmClass} btn-sm`} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
