// frontend/src/lib/openCreate.ts

import type { NavigateFunction } from 'react-router-dom'

export type OpenCreateTarget = 'products' | 'customers' | 'orders'

const STORAGE_KEY = 'inventra:pendingCreate'

export function markPendingCreate(target: OpenCreateTarget) {
  sessionStorage.setItem(STORAGE_KEY, target)
}

export function hasPendingCreate(target: OpenCreateTarget) {
  return sessionStorage.getItem(STORAGE_KEY) === target
}

export function clearPendingCreate() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function navigateToCreate(
  navigate: NavigateFunction,
  pathname: string,
  target: OpenCreateTarget,
) {
  markPendingCreate(target)
  navigate(pathname, { state: { openCreate: true } })
}
