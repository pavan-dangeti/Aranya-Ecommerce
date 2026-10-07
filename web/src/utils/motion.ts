import type { Variants } from 'framer-motion'

export const EASE_ORGANIC: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_ORGANIC },
  },
}

export const viewportOnce = { once: true, margin: '-80px' } as const
