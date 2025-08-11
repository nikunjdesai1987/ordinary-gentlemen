import React from 'react'
import { cn } from '../../lib/utils'

interface ResponsiveTableProps {
  columns: string[]
  rows: Record<string, any>[]
  className?: string
  onRowClick?: (row: Record<string, any>) => void
  sortable?: boolean
  onSort?: (column: string) => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
}

export function ResponsiveTable({
  columns,
  rows,
  className,
  onRowClick,
  sortable = false,
  onSort,
  sortColumn,
  sortDirection = 'asc'
}: ResponsiveTableProps) {
  const handleSort = (column: string) => {
    if (sortable && onSort) {
      onSort(column)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[color:var(--pl-border)]">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className={cn(
                      'cursor-pointer select-none transition-colors',
                      sortable && 'hover:bg-white/5'
                    )}
                    onClick={() => sortable && handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column}</span>
                      {sortable && sortColumn === column && (
                        <span className="text-primary">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    'cursor-pointer transition-colors',
                    onRowClick && 'hover:bg-white/5'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column} className="py-3 px-4">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile List */}
      <div className="md:hidden space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className={cn(
              'card p-4 space-y-3 cursor-pointer transition-all duration-200',
              onRowClick && 'hover:bg-white/5 hover:scale-[1.02]'
            )}
            onClick={() => onRowClick?.(row)}
          >
            {/* Primary Info Row */}
            <div className="table-mobile-header">
              <div className="table-mobile-title">
                {row[columns[0]] || 'N/A'}
              </div>
              {row[columns[1]] && (
                <div className="table-mobile-subtitle">
                  {row[columns[1]]}
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="table-mobile-metrics">
              {columns.slice(2).map((column) => (
                <div key={column} className="table-mobile-metric">
                  <span className="table-mobile-metric-label">{column}</span>
                  <span className="table-mobile-metric-value">
                    {row[column] || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface MobileListProps {
  rows: Array<{
    title: string
    subtitle?: string
    metrics?: Record<string, string | number>
    actions?: React.ReactNode
    onClick?: () => void
  }>
  className?: string
}

export function MobileList({ rows, className }: MobileListProps) {
  return (
    <ul className={cn('md:hidden space-y-3', className)}>
      {rows.map((row, index) => (
        <li key={index} className="card p-4">
          <div className="space-y-3">
            {/* Header with Actions */}
            <div className="table-mobile-header">
              <div className="flex-1">
                <div className="table-mobile-title">{row.title}</div>
                {row.subtitle && (
                  <div className="table-mobile-subtitle">{row.subtitle}</div>
                )}
              </div>
              {row.actions && (
                <div className="flex gap-2">{row.actions}</div>
              )}
            </div>

            {/* Metrics */}
            {row.metrics && (
              <div className="table-mobile-metrics">
                {Object.entries(row.metrics).map(([key, value]) => (
                  <div key={key} className="table-mobile-metric">
                    <span className="table-mobile-metric-label">{key}</span>
                    <span className="table-mobile-metric-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

interface TableSkeletonProps {
  columns: number
  rows: number
  className?: string
}

export function TableSkeleton({ columns, rows, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Skeleton */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[color:var(--pl-border)]">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="py-3 px-4">
                  <div className="loading-skeleton h-4 w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-3 px-4">
                    <div className="loading-skeleton h-4 w-16"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="loading-skeleton h-5 w-32"></div>
              <div className="loading-skeleton h-4 w-20"></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: Math.min(columns - 2, 4) }).map((_, colIndex) => (
                <div key={colIndex} className="flex items-center justify-between">
                  <div className="loading-skeleton h-4 w-16"></div>
                  <div className="loading-skeleton h-4 w-12"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
