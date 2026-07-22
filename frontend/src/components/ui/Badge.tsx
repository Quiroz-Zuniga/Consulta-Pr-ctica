import { ReactNode } from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  primary: {
    container: 'bg-primary-50 text-primary-700 border-primary-200/60',
    dot: 'bg-primary-500',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  error: {
    container: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dot: 'bg-rose-500',
  },
  info: {
    container: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dot: 'bg-sky-500',
  },
  neutral: {
    container: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] font-medium gap-1.5 rounded-md',
  md: 'px-2.5 py-1 text-xs font-medium gap-1.5 rounded-lg',
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span
      className={`inline-flex items-center border select-none transition-colors ${styles.container} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
