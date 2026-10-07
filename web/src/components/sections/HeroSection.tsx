import { lazy, useRef } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Scene3D } from '@/components/three/Scene3D'
import { HeroFallback } from '@/components/three/fallbacks'
import { useIsMobile, usePrefersReducedMotion } from '@/hooks'
import { ButtonLink } from '@/components/ui/Button'
import { EASE_ORGANIC } from '@/utils/motion'

const HeroScene = lazy(() =>
  import('@/components/three/HeroScene').then((m) => ({ default: m.HeroScene })),
)

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = usePrefersReducedMotion()
  const isMobile = useIsMobile()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '38%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const sceneOpacity = useTransform(scrollYProgress, [0.3, 0.95], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] min-h-[640px] overflow-hidden"
      aria-label="Welcome to Aranya"
    >
      <m.div
        style={reduced ? undefined : { scale: sceneScale, opacity: sceneOpacity }}
        className="absolute inset-0"
      >
        <Scene3D className="h-full w-full" fallback={<HeroFallback />}>
          {(active) => (
            <HeroScene active={active} reducedMotion={Boolean(reduced)} isMobile={isMobile} />
          )}
        </Scene3D>
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/55 via-transparent to-forest-950/85 pointer-events-none" />
      </m.div>

      <m.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <m.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9, ease: EASE_ORGANIC }}
          className="eyebrow text-bronze-400"
        >
          Aranya · Herbal Wellness
        </m.p>

        <m.h1
          initial={{ y: 26 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: EASE_ORGANIC }}
          className="mt-6 font-display text-[13vw] leading-[1.02] font-medium tracking-tight text-ivory-50 text-balance sm:text-7xl lg:text-8xl"
        >
          Ancient Wisdom.
          <br />
          <em className="font-light text-bronze-300 italic">Naturally</em> Reimagined.
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.9, ease: EASE_ORGANIC }}
          className="mt-7 max-w-xl text-base leading-relaxed text-sage-200/80 sm:text-lg"
        >
          Discover thoughtfully crafted herbal wellness products inspired by India's timeless
          traditions.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: EASE_ORGANIC }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <ButtonLink to="/products" variant="bronze" size="lg" magnetic>
            Explore Products
          </ButtonLink>
          <ButtonLink to="/story" variant="outlineLight" size="lg">
            Discover Our Story
          </ButtonLink>
        </m.div>
      </m.div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-ivory-50/50">
          <span className="text-[10px] font-semibold tracking-[0.28em] uppercase">
            Scroll to explore
          </span>
          {!reduced && (
            <m.span
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown size={17} />
            </m.span>
          )}
          {reduced && <ChevronDown size={17} />}
        </div>
      </m.div>
    </section>
  )
}
