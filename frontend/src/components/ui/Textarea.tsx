import { TextareaHTMLAttributes, forwardRef } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, required, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
    const errorId = error && textareaId ? `${textareaId}-error` : undefined

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          required={required}
          className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-800 shadow-subtle placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500/20 hover:border-slate-300'
          } ${className}`}
          {...props}
        />
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

Textarea.displayName = 'Textarea'
