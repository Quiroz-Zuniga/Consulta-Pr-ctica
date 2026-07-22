import { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center animate-fade-in ${className}`}
    >
      {icon && (
        <div className="mb-4 rounded-2xl bg-white p-4 text-slate-400 shadow-subtle border border-slate-200/80">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
