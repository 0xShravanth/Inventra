// frontend/src/hooks/useOpenCreateFromNavigation.ts

import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { hasPendingCreate, type OpenCreateTarget } from '@/lib/openCreate'

export function useOpenCreateFromNavigation(
  target: OpenCreateTarget,
  openCreate: () => void,
) {
  const location = useLocation()
  const navigate = useNavigate()
  const openCreateRef = useRef(openCreate)
  openCreateRef.current = openCreate

  useEffect(() => {
    const fromState =
      (location.state as { openCreate?: boolean } | null)?.openCreate === true
    const fromStorage = hasPendingCreate(target)

    if (!fromState && !fromStorage) return

    openCreateRef.current()

    if (fromState) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate, target])
}
