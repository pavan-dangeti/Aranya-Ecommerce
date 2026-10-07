import type { ReactNode } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/utils/cn'
import { fadeUp, viewportOnce } from '@/utils/motion'

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  description?: string
  tone?: 'dark' | 'light'
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = 'dark',
  align = 'center',
  className,
}: SectionHeadingProps) {
  const light = tone === 'light'
  return (
    <m.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}
    >
      <p className={cn('eyebrow mb-4', light ? 'text-bronze-400' : 'text-bronze-700')}>{eyebrow}</p>
      <h2
        className={cn(
          'font-display text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl',
          light ? 'text-ivory-50' : 'text-forest-900',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-5 text-base leading-relaxed',
            light ? 'text-sage-200/75' : 'text-forest-900/65',
          )}
        >
          {description}
        </p>
      )}
    </m.div>
  )
}
