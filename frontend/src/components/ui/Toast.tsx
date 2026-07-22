import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ type, title, message }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, type, title, message }])
      setTimeout(() => {
        removeToast(id)
      }, 4500)
    },
    [removeToast],
  )

  const success = useCallback(
    (title: string, message?: string) => toast({ type: 'success', title, message }),
    [toast],
  )
  const error = useCallback(
    (title: string, message?: string) => toast({ type: 'error', title, message }),
    [toast],
  )
  const warning = useCallback(
    (title: string, message?: string) => toast({ type: 'warning', title, message }),
    [toast],
  )
  const info = useCallback(
    (title: string, message?: string) => toast({ type: 'info', title, message }),
    [toast],
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-elevated bg-white animate-slide-up transition-all ${
              t.type === 'success'
                ? 'border-emerald-200 text-emerald-900'
                : t.type === 'error'
                  ? 'border-rose-200 text-rose-900'
                  : t.type === 'warning'
                    ? 'border-amber-200 text-amber-900'
                    : 'border-sky-200 text-sky-900'
            }`}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-sky-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold">{t.title}</h5>
              {t.message && <p className="mt-0.5 text-xs opacity-80">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 rounded p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider')
  }
  return context
}
