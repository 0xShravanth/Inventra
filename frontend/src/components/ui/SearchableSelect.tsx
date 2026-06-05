// frontend/src/components/ui/SearchableSelect.tsx

import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  meta?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((option) => option.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        option.description?.toLowerCase().includes(q) ||
        option.meta?.toLowerCase().includes(q),
    )
  }, [options, query])

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/[0.08] focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
      >
        <span className={selected ? 'text-white' : 'text-white/30'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-white/40" />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#111113] text-white shadow-2xl"
          style={{
            backgroundColor: '#111113',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-white/40">No results found</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={cn(
                    'flex w-full cursor-pointer flex-col px-3 py-2.5 text-left text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white focus:bg-white/[0.08] focus:text-white',
                    value === option.value && 'bg-white/[0.06] text-white',
                  )}
                >
                  <span className="text-sm">{option.label}</span>
                  {(option.description || option.meta) && (
                    <span className="mt-0.5 text-xs text-white/40">
                      {[option.description, option.meta].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
