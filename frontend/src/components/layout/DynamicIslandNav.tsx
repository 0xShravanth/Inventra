// frontend/src/components/layout/DynamicIslandNav.tsx

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Plus,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { navigateToCreate, type OpenCreateTarget } from '@/lib/openCreate'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

const quickActions: {
  label: string
  icon: LucideIcon
  pathname: string
  target: OpenCreateTarget
}[] = [
  { label: 'New Product', icon: Package, pathname: '/products', target: 'products' },
  { label: 'New Customer', icon: Users, pathname: '/customers', target: 'customers' },
  { label: 'New Order', icon: ShoppingCart, pathname: '/orders', target: 'orders' },
]

export function DynamicIslandNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  return (
    <>
      <nav
        className="pointer-events-none fixed left-0 right-0 top-5 z-50 hidden justify-center md:flex"
        aria-label="Main navigation"
      >
        <motion.div
          animate={{ width: scrolled ? 480 : 560 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="pointer-events-auto flex h-[52px] max-w-[560px] items-center justify-between rounded-full border border-white/[0.08] bg-[rgba(10,10,11,0.8)] shadow-island shadow-island-inner backdrop-blur-[20px] backdrop-saturate-[180%]"
          style={{ padding: '6px 8px', width: scrolled ? 480 : 560 }}
        >
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Inventra</span>
          </div>

          <div className="relative flex items-center gap-0.5">
            {navItems.map((item) => {
              const active = isActive(item.to, item.end)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'relative z-10 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                    active ? 'text-white' : 'text-white/50 hover:text-white/80',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </NavLink>
              )
            })}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setQuickOpen(true)}
            className="flex items-center gap-1 rounded-full bg-indigo-500 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </motion.button>
        </motion.div>
      </nav>

      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick Actions">
        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setQuickOpen(false)
                  navigateToCreate(navigate, action.pathname, action.target)
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-white">{action.label}</p>
              </motion.button>
            )
          })}
        </div>
      </Modal>
    </>
  )
}
