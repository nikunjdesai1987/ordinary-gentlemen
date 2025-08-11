import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus:shadow-focus touch-target',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-[color:var(--color-primary-contrast)] hover:opacity-90 active:opacity-80 shadow-card',
        secondary: 'bg-secondary text-white hover:shadow-magenta-glow',
        ghost: 'bg-transparent text-white border border-[color:var(--pl-border)] hover:bg-[rgba(255,255,255,.06)] hover:border-white/20',
        outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-[color:var(--color-primary-contrast)] hover:shadow-neon-glow',
        danger: 'bg-danger text-white hover:opacity-90 active:opacity-80',
        success: 'bg-success text-[color:var(--color-primary-contrast)] hover:opacity-90 active:opacity-80',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-5 py-3 text-[15px]',
        lg: 'px-6 py-4 text-lg',
        xl: 'px-8 py-5 text-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="loading-spinner w-4 h-4 mr-2" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        
        {children}
        
        {rightIcon && !loading && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
