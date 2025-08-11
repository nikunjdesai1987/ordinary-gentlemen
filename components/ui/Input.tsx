import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  help?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, help, leftIcon, rightIcon, fullWidth = false, ...props }, ref) => {
    return (
      <div className={cn('form-group', fullWidth && 'w-full')}>
        {label && (
          <label className="form-label">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              'input',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'input-error',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}
        
        {help && !error && (
          <p className="form-help">
            {help}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  help?: string
  fullWidth?: boolean
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, help, fullWidth = false, ...props }, ref) => {
    return (
      <div className={cn('form-group', fullWidth && 'w-full')}>
        {label && (
          <label className="form-label">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={cn(
            'input min-h-[100px] resize-none',
            error && 'input-error',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}
        
        {help && !error && (
          <p className="form-help">
            {help}
          </p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  help?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  fullWidth?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, help, options, placeholder, fullWidth = false, ...props }, ref) => {
    return (
      <div className={cn('form-group', fullWidth && 'w-full')}>
        {label && (
          <label className="form-label">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={cn(
            'input',
            error && 'input-error',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}
        
        {help && !error && (
          <p className="form-help">
            {help}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Input, TextArea, Select }
