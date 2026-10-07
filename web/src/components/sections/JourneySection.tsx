import { useRef } from 'react'
import { m, useScroll, useSpring } from 'framer-motion'
import { Compass, HandHeart, Leaf, MoonStar } from 'lucide-react'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, viewportOnce } from '@/utils/motion'

const STEPS = [
  {
    number: '01',
    icon: Compass,
    title: 'Discover',
    body: 'Wander the apothecary. Read where each plant grew and how it lived in Indian tradition before it reached your shelf.',
  },
  {
    number: '02',
    icon: HandHeart,
    title: 'Choose',
    body: 'Pick what suits your season — one ritual, not ten. Our notes help you match herbs to the rhythm of your days.',
  },
  {
    number: '03',
    icon: Leaf,
    title: 'Make it a ritual',
    body: 'Anchor each product to a moment you already keep. Morning water, afternoon infusion, Sunday champi.',
  },
  {
    number: '04',
    icon: MoonStar,
    title: 'Feel the difference',
    body: 'Tradition asks for patience — weeks of small, repeated care. Notice what changes when you show up gently.',
  },
]

export function JourneySection() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 0.72', 'end 0.55'],
  })
  const lineScale = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })

  return (
    <section className="bg-ivory-50 py-28 lg:py-36" aria-labelledby="journey-heading">
      <div className="shell">
        <SectionHeading
          eyebrow="Wellness Journey"
          title={
            <>
              Your Wellness <em className="font-light text-bronze-500 italic">Ritual</em>
            </>
          }
          description="Four unhurried steps from curiosity to habit. The path matters more than the pace."
        />

        <div ref={trackRef} className="relative mx-auto mt-20 max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[27px] w-px bg-forest-900/[0.09] sm:left-1/2"
          />
          <m.div
            aria-hidden="true"
            style={{ scaleY: lineScale }}
            className="absolute top-0 bottom-0 left-[27px] w-px origin-top bg-bronze-500 sm:left-1/2"
          />

          <ol className="space-y-14">
            {STEPS.map((step, i) => (
              <li key={step.number}>
                <m.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  className={`relative flex items-start gap-6 sm:w-1/2 ${
                    i % 2 === 0
                      ? 'sm:pr-14'
                      : 'sm:ml-auto sm:flex-row-reverse sm:pl-14 sm:text-right'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1 grid size-14 place-items-center rounded-full border border-bronze-500/40 bg-ivory-50 text-bronze-700 shadow-[0_0_0_6px_var(--color-ivory-50)] ${
                      i % 2 === 0 ? 'sm:-right-7' : 'sm:-left-7'
                    } relative z-10 shrink-0`}
                  >
                    <step.icon size={22} strokeWidth={1.6} />
                  </span>

                  <div className={i % 2 === 1 ? 'w-full' : ''}>
                    <span className="font-display text-4xl font-light text-bronze-500 italic">
                      {step.number}
                    </span>
                    <h3 className="mt-1 font-display text-2xl font-medium">{step.title}</h3>
                    <p
                      className={`mt-2.5 text-sm leading-relaxed text-forest-900/65 ${i % 2 === 1 ? 'sm:ml-auto sm:max-w-xs' : ''}`}
                    >
                      {step.body}
                    </p>
                  </div>
                </m.div>
              </li>
            ))}
          </ol>
        </div>

        <p id="journey-heading" className="sr-only">
          Your wellness ritual in four steps
        </p>
      </div>
    </section>
  )
}
