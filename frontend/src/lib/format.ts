// frontend/src/lib/format.ts

import { format, formatDistanceToNow } from 'date-fns'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value))
}

export function formatDate(value: string) {
  return format(new Date(value), 'MMM d, yyyy')
}

export function formatRelative(value: string) {
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text
  return `${text.slice(0, length)}…`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function getAvatarColor(name: string) {
  const letter = name.trim()[0]?.toUpperCase() || 'A'
  if ('ABCDEF'.includes(letter)) return 'bg-indigo-500/20 text-indigo-300'
  if ('GHIJKL'.includes(letter)) return 'bg-emerald-500/20 text-emerald-300'
  if ('MNOPQR'.includes(letter)) return 'bg-amber-500/20 text-amber-300'
  return 'bg-rose-500/20 text-rose-300'
}

export function getStockBadgeVariant(quantity: number): BadgeVariant {
  if (quantity === 0) return 'danger'
  if (quantity < 10) return 'warning'
  return 'success'
}

export function getStockLabel(quantity: number) {
  if (quantity === 0) return 'Out of Stock'
  if (quantity < 10) return 'Low Stock'
  return 'In Stock'
}

export const idCellClass = 'font-mono text-sm text-white/40'
export const amountCellClass = 'font-mono tabular-nums text-white'

export function formatId(value: string) {
  return value.slice(0, 8)
}
