import type { ReactNode } from 'react'
import { m } from 'framer-motion'
import { EASE_ORGANIC } from '@/utils/motion'

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.div
      // No fade-in: the page's largest text must paint as soon as it renders.
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE_ORGANIC }}
      className={className}
    >
      {children}
    </m.div>
  )
}
