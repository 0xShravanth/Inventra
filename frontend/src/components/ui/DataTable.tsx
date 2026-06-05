// frontend/src/components/ui/DataTable.tsx

import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Inbox } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  align?: 'left' | 'right'
  width?: string
  render?: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  rowKey: (row: T) => string
}

type SortDirection = 'asc' | 'desc'

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  emptyDescription = 'There is nothing to show here yet.',
  rowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return

    if (sortKey !== column.key) {
      setSortKey(column.key)
      setSortDirection('asc')
      return
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc')
      return
    }

    setSortKey(null)
    setSortDirection('asc')
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data

    const activeColumn = columns.find((col) => col.key === sortKey)
    if (!activeColumn) return data

    return [...data].sort((a, b) => {
      const aValue = activeColumn.sortValue
        ? activeColumn.sortValue(a)
        : (a as Record<string, unknown>)[activeColumn.key]
      const bValue = activeColumn.sortValue
        ? activeColumn.sortValue(b)
        : (b as Record<string, unknown>)[activeColumn.key]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [columns, data, sortDirection, sortKey])

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#1A1A1F]">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed bg-transparent">
            <thead className="sticky top-0 border-b border-white/5 bg-[#141418]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-white/40',
                      column.align === 'right' && 'text-right',
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded-md bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!sortedData.length) {
    return (
      <EmptyState
        icon={Inbox}
        title={emptyMessage}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#1A1A1F]">
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed bg-transparent">
          <thead className="sticky top-0 z-10 border-b border-white/5 bg-[#141418] backdrop-blur">
            <tr>
              {columns.map((column) => {
                const isActive = sortKey === column.key
                return (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-white/40',
                      column.align === 'right' && 'text-right',
                      column.sortable && 'cursor-pointer select-none hover:text-white/70',
                      column.className,
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        column.align === 'right' && 'justify-end w-full',
                      )}
                    >
                      {column.header}
                      {column.sortable && (
                        <motion.span
                          initial={false}
                          animate={{ opacity: isActive ? 1 : 0.35, y: isActive ? 0 : 2 }}
                          className="text-white/60"
                        >
                          {isActive && sortDirection === 'desc' ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronUp className="h-3.5 w-3.5" />
                          )}
                        </motion.span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <motion.tr
                key={rowKey(row)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-4 text-sm text-white/80',
                      column.align === 'right' && 'text-right',
                      column.className,
                    )}
                  >
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
