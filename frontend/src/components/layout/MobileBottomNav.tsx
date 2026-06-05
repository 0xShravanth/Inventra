// frontend/src/components/layout/MobileBottomNav.tsx

import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
]

export function MobileBottomNav() {
  const location = useLocation()

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0A0A0B]/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-safe pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.to, tab.end)

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="relative flex flex-1 flex-col items-center gap-1 py-2"
            >
              {active && (
                <motion.span
                  layoutId="mobile-bottom-indicator"
                  className="absolute -top-0.5 h-1 w-1 rounded-full bg-indigo-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  active ? 'text-indigo-400' : 'text-white/40',
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors',
                  active ? 'text-indigo-400' : 'text-white/40',
                )}
              >
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
