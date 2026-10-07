import { m } from 'framer-motion'
import { PackageOpen, Recycle, Sprout } from 'lucide-react'
import { fadeUp, viewportOnce } from '@/utils/motion'

const PILLARS = [
  {
    icon: PackageOpen,
    title: 'Minimal by design',
    body: 'Our vessels are amber glass and aluminium — chosen to be refilled, repurposed, or recycled. No cellophane, no plastic trays, no filler inserts.',
  },
  {
    icon: Recycle,
    title: 'Paper, not promises',
    body: 'Boxes use FSC-mix board printed with soy ink. We would rather say less and do more: packaging that goes into your paper recycling tonight.',
  },
  {
    icon: Sprout,
    title: 'Grown, not stripped',
    body: 'Herbs are cultivated with partner farms on rotating plots rather than wild-harvested, giving the source landscape time to breathe between seasons.',
  },
]

export function SustainabilitySection() {
  return (
    <section
      className="relative overflow-hidden bg-sand-300/40 py-28 lg:py-36"
      aria-labelledby="sustain-heading"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 500"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full opacity-[0.12]"
        fill="none"
        stroke="#33543d"
        strokeWidth="1.1"
      >
        <path
          d="M0 480 C240 380 320 420 480 300 S760 260 960 340 1240 300 1440 220"
          strokeLinecap="round"
        />
        <path
          d="M0 520 C260 440 360 470 520 360 S800 330 1000 400 1280 370 1440 290"
          strokeLinecap="round"
          opacity="0.6"
        />
        {Array.from({ length: 14 }).map((_, i) => (
          <g key={i} transform={`translate(${60 + i * 104} ${430 - (i % 3) * 26})`}>
            <path d="M0 40 C0 10 8 -6 20 -20 C32 -6 40 10 40 40" strokeLinecap="round" />
            <path d="M8 18 C14 8 22 2 30 -2 M32 16 C28 8 22 2 14 -2" strokeLinecap="round" />
          </g>
        ))}
      </svg>

      <div className="shell relative z-10">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
          <m.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <p className="eyebrow mb-4 text-bronze-700">Tread Lightly</p>
            <h2
              id="sustain-heading"
              className="font-display text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl"
            >
              Packaging that returns to the shelf, the soil, or the bin —{' '}
              <em className="font-light text-bronze-700 italic">in that order.</em>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-forest-900/65">
              Ayurveda has always been a philosophy of enough. We try to ship like we mean it: small
              batches, short distances, and materials your city's existing waste system already
              knows how to handle.
            </p>
          </m.div>

          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
            className="space-y-4"
          >
            {PILLARS.map((pillar) => (
              <m.article
                key={pillar.title}
                variants={fadeUp}
                className="flex gap-5 rounded-3xl border border-forest-900/[0.07] bg-ivory-50/70 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-ivory-50 hover:shadow-lift sm:p-7"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-forest-900/[0.05] text-moss-600">
                  <pillar.icon size={21} strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-medium">{pillar.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-forest-900/65">{pillar.body}</p>
                </div>
              </m.article>
            ))}
          </m.div>
        </div>

        <p id="sustain-heading" className="sr-only">
          Our approach to sustainability
        </p>
      </div>
    </section>
  )
}
