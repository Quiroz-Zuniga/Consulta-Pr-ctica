import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  labelClassName?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelClassName, error, helperText, leftIcon, rightIcon, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const errorId = error && inputId ? `${inputId}-error` : undefined
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined

    const hasBg = className.includes('bg-')
    const hasText = className.includes('text-')

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-semibold uppercase tracking-wider ${labelClassName || 'text-slate-600'}`}
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
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            required={required}
            className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-subtle placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 ${
              hasBg ? '' : 'bg-white'
            } ${
              hasText ? '' : 'text-slate-800'
            } ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon ? 'pr-9' : ''} ${
              error
                ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-300'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs font-medium text-rose-600 animate-fade-in flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
