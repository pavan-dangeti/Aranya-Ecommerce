import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { EASE_ORGANIC } from '@/utils/motion'
import { useDialog } from '@/hooks/useDialog'

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const dialogRef = useDialog(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-80 grid place-items-center overflow-y-auto p-4"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <m.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 cursor-pointer bg-forest-950/60 backdrop-blur-sm"
          />
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.4, ease: EASE_ORGANIC }}
            className={cn(
              'relative w-full rounded-3xl border border-ivory-50/[0.08] bg-forest-900 p-7 shadow-lift-lg sm:p-8',
              wide ? 'max-w-2xl' : 'max-w-lg',
            )}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-medium text-ivory-50">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 cursor-pointer place-items-center rounded-full text-sage-300/70 transition-colors hover:bg-ivory-50/[0.06] hover:text-ivory-50"
              >
                <X size={17} />
              </button>
            </div>
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const dialogRef = useDialog(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-80"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <m.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-forest-950/60 backdrop-blur-sm"
          />
          <m.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: EASE_ORGANIC }}
            className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-ivory-50/[0.08] bg-forest-900 shadow-lift-lg"
          >
            <div className="flex items-center justify-between border-b border-ivory-50/[0.08] px-7 py-5">
              <h2 className="font-display text-xl font-medium text-ivory-50">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="grid size-9 cursor-pointer place-items-center rounded-full text-sage-300/70 transition-colors hover:bg-ivory-50/[0.06] hover:text-ivory-50"
              >
                <X size={17} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Delete',
  danger = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-4">
        {danger && (
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clay-500/15 text-clay-400">
            <AlertTriangle size={19} strokeWidth={1.8} />
          </span>
        )}
        <p className="text-sm leading-relaxed text-sage-200/80">{body}</p>
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-ivory-50/15 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-sage-200/80 uppercase transition-colors hover:border-ivory-50/40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={cn(
            'cursor-pointer rounded-full px-5 py-2.5 text-xs font-bold tracking-[0.12em] uppercase transition-colors',
            danger
              ? 'bg-clay-500 text-ivory-50 hover:bg-clay-600'
              : 'bg-bronze-500 text-forest-950 hover:bg-bronze-400',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
