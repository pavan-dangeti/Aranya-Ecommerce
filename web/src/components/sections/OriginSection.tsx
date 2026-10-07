import { lazy, useState } from 'react'
import { m, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { Ingredient } from '@/types'
import { useIngredients } from '@/hooks/useCatalog'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Scene3D } from '@/components/three/Scene3D'
import { useIsMobile, useMediaQuery, usePrefersReducedMotion } from '@/hooks'
import { fadeUp, viewportOnce } from '@/utils/motion'

const BotanicalDrift = lazy(() =>
  import('@/components/three/BotanicalDrift').then((m) => ({ default: m.BotanicalDrift })),
)

export function OriginSection() {
  const { data: ingredients = [] } = useIngredients()

  const isMobile = useIsMobile()
  const reduced = usePrefersReducedMotion()
  return (
    <section
      className="relative overflow-hidden bg-forest-950 py-28 lg:py-36"
      aria-labelledby="origin-heading"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <Scene3D className="h-full w-full" fallback={null}>
          {(active) => (
            <BotanicalDrift active={active} reducedMotion={Boolean(reduced)} isMobile={isMobile} />
          )}
        </Scene3D>
      </div>

      <div className="shell relative z-10">
        <SectionHeading
          eyebrow="Herbal Origin"
          title={
            <>
              From the Earth, <em className="font-light text-bronze-300 italic">With Intention.</em>
            </>
          }
          description="Six botanicals anchor our apothecary — each grown in its favoured soil, harvested at its moment, and prepared the slow way. Hover to meet them."
          tone="light"
        />

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ingredients.map((ingredient) => (
            <m.div key={ingredient.id} variants={fadeUp}>
              <TiltCard ingredient={ingredient} />
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  )
}

function TiltCard({ ingredient }: { ingredient: Ingredient }) {
  const reduced = usePrefersReducedMotion()
  const finePointer = useMediaQuery('(pointer: fine)')
  const [hovered, setHovered] = useState(false)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 160, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 160, damping: 18 })

  return (
    <div
      style={{ perspective: 900 }}
      onMouseMove={(e) => {
        if (!finePointer || reduced) return
        const rect = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - rect.left) / rect.width - 0.5)
        my.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        mx.set(0)
        my.set(0)
      }}
      className="h-full"
    >
      <m.div
        style={
          finePointer && !reduced ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined
        }
        className="group relative h-full overflow-hidden rounded-3xl border border-ivory-50/[0.09] bg-forest-900/85 p-7 backdrop-blur-sm transition-colors duration-500 hover:border-bronze-500/40"
      >
        <div
          aria-hidden="true"
          className="absolute -top-14 -right-14 size-40 rounded-full blur-2xl transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle, ${ingredient.palette.accent}30, transparent 70%)`,
            opacity: hovered ? 1 : 0.4,
          }}
        />
        <div style={{ transform: 'translateZ(30px)' }} className="relative">
          <div className="flex items-start justify-between">
            <span
              aria-hidden="true"
              className="grid size-14 place-items-center rounded-full"
              style={{ background: `${ingredient.palette.soft}22` }}
            >
              <LeafGlyph deep={ingredient.palette.deep} soft={ingredient.palette.soft} />
            </span>
            <span className="font-display text-lg text-sage-300/70 italic">
              {ingredient.sanskritName}
            </span>
          </div>

          <h3 className="mt-6 font-display text-2xl font-medium text-ivory-50">
            {ingredient.name}
          </h3>
          <p className="mt-0.5 text-xs tracking-wide text-sage-300/70 italic">
            {ingredient.latinName}
          </p>

          <p className="mt-4 min-h-[4.5rem] text-sm leading-relaxed text-sage-200/70">
            {ingredient.description}
          </p>

          <dl className="mt-5 space-y-2 border-t border-ivory-50/[0.08] pt-4 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-sage-300/70">Origin</dt>
              <dd className="text-right font-semibold text-sage-200/85">{ingredient.origin}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sage-300/70">Tradition</dt>
              <dd className="text-right font-semibold text-sage-200/85">
                {ingredient.traditionalCategory}
              </dd>
            </div>
          </dl>
        </div>
      </m.div>
    </div>
  )
}

function LeafGlyph({ deep, soft }: { deep: string; soft: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="26"
      height="26"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 27V13" stroke={soft} strokeWidth="1.8" />
      <path
        d="M16 17c0-6 3.6-9.6 9-10.5C24.4 12 21.4 15.6 16 17Z"
        stroke={soft}
        fill={deep}
        fillOpacity="0.35"
        strokeWidth="1.6"
      />
      <path
        d="M16 20c0-4.6-2.6-7.4-6.8-8.3C9.9 16 12.4 18.8 16 20Z"
        stroke={soft}
        strokeWidth="1.6"
        opacity="0.6"
      />
    </svg>
  )
}
