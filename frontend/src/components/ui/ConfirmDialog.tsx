// frontend/src/components/ui/ConfirmDialog.tsx

import { motion } from 'framer-motion'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm leading-relaxed text-white/60">{description}</p>

      <div className="mt-6 flex items-center justify-end gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onCancel}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/15"
        >
          Cancel
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium text-white transition-colors',
            variant === 'destructive'
              ? 'bg-rose-500 hover:bg-rose-400'
              : 'bg-indigo-500 hover:bg-indigo-400',
          )}
        >
          {confirmLabel}
        </motion.button>
      </div>
    </Modal>
  )
}
