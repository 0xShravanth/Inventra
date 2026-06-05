// frontend/src/components/ui/StatsCard.tsx

import { motion, useInView } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type StatsColor = 'indigo' | 'emerald' | 'amber' | 'rose'

interface StatsCardProps {
  label: string
  value: number
  change?: number
  icon: LucideIcon
  color?: StatsColor
  index?: number
}

const colorStyles: Record<
  StatsColor,
  { bg: string; text: string; iconBg: string }
> = {
  indigo: {
    bg: 'from-indigo-500/20 to-purple-500/10',
    text: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15 text-indigo-400',
  },
  emerald: {
    bg: 'from-emerald-500/20 to-teal-500/10',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  amber: {
    bg: 'from-amber-500/20 to-orange-500/10',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  rose: {
    bg: 'from-rose-500/20 to-pink-500/10',
    text: 'text-rose-400',
    iconBg: 'bg-rose-500/15 text-rose-400',
  },
}

function useCountUp(target: number, enabled: boolean, duration = 900) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, enabled, duration])

  return count
}

export function StatsCard({
  label,
  value,
  change,
  icon: Icon,
  color = 'indigo',
  index = 0,
}: StatsCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const displayValue = useCountUp(value, isInView)
  const styles = colorStyles[color]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/5 bg-[#1A1A1F] p-6 shadow-lg transition-shadow hover:shadow-xl',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50',
          styles.bg,
        )}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            styles.iconBg,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {typeof change === 'number' && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              change >= 0
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400',
            )}
          >
            {change >= 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>

      <div className="relative mt-5">
        <motion.p
          key={displayValue}
          initial={{ opacity: 0.6, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold leading-none tracking-tight text-white md:text-3xl"
        >
          {displayValue.toLocaleString()}
        </motion.p>
        <p className="mt-2 text-[13px] font-medium uppercase tracking-widest text-white/50">
          {label}
        </p>
      </div>
    </motion.div>
  )
}
