// frontend/src/components/layout/AppLayout.tsx

import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { DynamicIslandNav } from '@/components/layout/DynamicIslandNav'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0B] pb-20 md:pb-0">
      <DynamicIslandNav />
      <MobileBottomNav />

      <main className="min-h-screen bg-[#0A0A0B] px-4 pt-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
