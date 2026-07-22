import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, leftIcon, className = '', id, required, children, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const errorId = error && selectId ? `${selectId}-error` : undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            required={required}
            className={`block w-full appearance-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 ${
              leftIcon ? 'pl-9' : ''
            } ${
              error
                ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-300'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 flex items-center text-slate-400">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={errorId} className="text-xs font-medium text-rose-600 animate-fade-in">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
