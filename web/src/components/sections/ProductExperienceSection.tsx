import { lazy, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import type { Product } from '@/types'
import { useProducts } from '@/hooks/useProducts'
import { Scene3D } from '@/components/three/Scene3D'
import { ProductSceneFallback } from '@/components/three/fallbacks'
import { useIsMobile, usePrefersReducedMotion } from '@/hooks'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EASE_ORGANIC, viewportOnce, fadeUp } from '@/utils/motion'

const ProductScene = lazy(() =>
  import('@/components/three/ProductScene').then((m) => ({ default: m.ProductScene })),
)

const LABELS = [
  'Plant-based ingredients',
  'Thoughtfully sourced',
  'Batch-made in small lots',
  'Made with care',
] as const

const SHOWCASE_SLUGS = ['kumkumadi-night-oil', 'tulsi-elixir', 'bhringraj-hair-oil']

export function ProductExperienceSection() {
  const reduced = usePrefersReducedMotion()
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState(0)

  // One catalogue request, then pick the showcase slugs out of it.
  const { data: catalogue } = useProducts({ sort: 'featured', page: 1, pageSize: 48 })
  const bySlug = new Map((catalogue?.items ?? []).map((p) => [p.slug, p]))
  const showcase = SHOWCASE_SLUGS.map((slug) => bySlug.get(slug)).filter((p): p is Product =>
    Boolean(p),
  )
  const current = showcase[selected]

  return (
    <section
      className="relative overflow-hidden bg-forest-950 py-28 lg:py-36"
      aria-labelledby="experience-heading"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[80%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,#1b3527_0%,transparent_65%)]" />
      </div>

      <div className="shell relative z-10">
        <SectionHeading
          eyebrow="The Craft"
          title={
            <>
              Hold the Ritual in Your <em className="font-light text-bronze-300 italic">Hands</em>
            </>
          }
          description="Drag to turn. Scroll to lean closer. Every vessel is shaped by the same principles that guide what goes inside it — patience, honesty, restraint."
          tone="light"
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative mx-auto aspect-square w-full max-w-xl"
            data-testid="product-scene"
          >
            <FloatingLabel position="left-[2%] top-[18%]" text={LABELS[0]} light />
            <FloatingLabel position="right-[0%] top-[30%]" text={LABELS[1]} />
            <FloatingLabel position="bottom-[24%] left-[4%]" text={LABELS[3]} />
            <FloatingLabel position="right-[6%] bottom-[12%]" text={LABELS[2]} />

            {current && (
              <Scene3D
                className="h-full w-full"
                fallback={
                  <ProductSceneFallback
                    glass={current.visual.glass}
                    accent={current.visual.accent}
                  />
                }
              >
                {(active) => (
                  <ProductScene
                    key={current.id}
                    active={active}
                    reducedMotion={Boolean(reduced)}
                    palette={{ glass: current.visual.glass, accent: current.visual.accent }}
                  />
                )}
              </Scene3D>
            )}
          </m.div>

          <div>
            <AnimatePresence mode="wait">
              {current && (
                <m.div
                  key={current.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: EASE_ORGANIC }}
                >
                  <h3 className="font-display text-2xl font-medium text-ivory-50">
                    {current.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-sage-200/70">
                    {current.shortDescription}
                  </p>
                </m.div>
              )}
            </AnimatePresence>

            <div
              role="tablist"
              aria-label="Choose a product to display"
              className="mt-8 flex flex-wrap gap-2.5"
            >
              {showcase.map((p, i) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={i === selected}
                  onClick={() => setSelected(i)}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                    i === selected
                      ? 'border-bronze-400 bg-bronze-500/15 text-bronze-300'
                      : 'border-ivory-50/15 text-sage-300/70 hover:border-bronze-500/40 hover:text-sage-200'
                  }`}
                >
                  {p.name.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>

            <ul className="mt-9 space-y-3.5 border-t border-ivory-50/[0.08] pt-7 text-sm text-sage-200/75">
              {LABELS.map((label) => (
                <li key={label} className="flex items-center gap-3">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-bronze-400" />
                  {label}
                </li>
              ))}
            </ul>
            {!isMobile && !reduced && (
              <p className="mt-8 text-xs tracking-wide text-sage-300/70 uppercase">
                Drag to rotate · Scroll to zoom
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FloatingLabel({
  position,
  text,
  light = false,
}: {
  position: string
  text: string
  light?: boolean
}) {
  return (
    <m.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`pointer-events-none absolute z-10 hidden md:block ${position}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="size-1.5 animate-pulse rounded-full bg-bronze-400 motion-reduce:animate-none" />
        <span className="rounded-full border border-ivory-50/15 bg-forest-900/60 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-ivory-50/90 uppercase backdrop-blur-md">
          {text}
        </span>
        {light && null}
      </div>
    </m.div>
  )
}
