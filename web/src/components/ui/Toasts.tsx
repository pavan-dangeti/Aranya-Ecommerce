import { AnimatePresence, m } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToasts } from '@/store/toastStore'
import { EASE_ORGANIC } from '@/utils/motion'

const icons = { success: CheckCircle2, error: XCircle, info: Info }

export function Toasts() {
  const toasts = useToasts((s) => s.toasts)
  const dismiss = useToasts((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-90 flex w-full max-w-sm flex-col gap-2.5">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.tone]
          return (
            <m.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.35, ease: EASE_ORGANIC }}
              role="status"
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-ivory-50/[0.1] bg-forest-900 px-4 py-3.5 shadow-lift-lg"
            >
              <Icon
                size={18}
                className={
                  t.tone === 'success'
                    ? 'text-sage-400'
                    : t.tone === 'error'
                      ? 'text-clay-500'
                      : 'text-bronze-400'
                }
                strokeWidth={1.8}
              />
              <p className="flex-1 text-sm font-semibold text-ivory-50">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="cursor-pointer rounded-full p-1 text-sage-300/70 transition-colors hover:text-ivory-50"
              >
                <X size={14} />
              </button>
            </m.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
