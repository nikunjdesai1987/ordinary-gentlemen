import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover = false, padding = 'md', ...props }, ref) => {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'card',
          paddingClasses[padding],
          hover && 'card-hover',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  actions?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mb-4 flex items-center justify-between', className)}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-base font-semibold',
      md: 'text-lg font-semibold',
      lg: 'text-xl font-semibold',
    }

    return (
      <h3
        ref={ref}
        className={cn(sizeClasses[size], 'text-white', className)}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('pt-4 border-t border-[color:var(--pl-border)] flex items-center justify-between', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
