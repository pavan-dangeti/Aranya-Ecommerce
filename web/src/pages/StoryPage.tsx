import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Leaf, MoonStar, PackageOpen, Sprout } from 'lucide-react'
import { PageShell } from './PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useDocumentMeta } from '@/hooks'
import { fadeUp, viewportOnce } from '@/utils/motion'

const VALUES = [
  {
    icon: Sprout,
    title: 'Source-first',
    body: 'Every herb is traceable to a farm and a harvest window. We publish origin because we are proud of it.',
  },
  {
    icon: PackageOpen,
    title: 'Honest preparation',
    body: "Whole herbs, slow decoctions, short ingredient lists. If it isn't in the jar, it isn't on the label.",
  },
  {
    icon: MoonStar,
    title: 'Ritual over routine',
    body: 'We design products to be met with attention — a moment of pause, not another chore.',
  },
  {
    icon: Leaf,
    title: 'Tradition, footnoted',
    body: "When we speak of Ayurveda we cite its practice, not miracle outcomes. Herbs accompany care; they don't replace it.",
  },
]

export default function StoryPage() {
  useDocumentMeta(
    'Our Story — ARANYA',
    'Aranya began in a courtyard garden in Bengaluru with a simple question: what would wellness look like if tradition led?',
  )

  return (
    <PageShell className="bg-ivory-50">
      <header className="relative overflow-hidden bg-forest-950 pt-40 pb-28 text-center text-ivory-50">
        <div
          aria-hidden="true"
          className="absolute top-[-25%] left-1/2 h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,#1b3527_0%,transparent_65%)]"
        />
        <m.div variants={fadeUp} initial="hidden" animate="visible" className="shell relative">
          <p className="eyebrow text-bronze-400">Our Story</p>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-[1.06] font-medium tracking-tight text-balance sm:text-6xl">
            Aranya means forest —{' '}
            <em className="font-light text-bronze-300 italic">
              a place that grows slowly and gives generously.
            </em>
          </h1>
        </m.div>
      </header>

      <section className="shell grid gap-12 py-24 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <m.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="font-display text-2xl leading-relaxed font-light text-forest-800 sm:text-[1.75rem]"
        >
          Aranya began around a grandmother's mortar and pestle, with a simple question: what would
          modern wellness look like if tradition were allowed to lead?
        </m.p>

        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="space-y-5 leading-[1.85] text-forest-900/70"
        >
          <p>
            We work directly with fourteen partner farms across Rajasthan, Meghalaya, Kerala,
            Karnataka and the Western Ghats. Herbs are grown on rotating plots, harvested at their
            traditional moment, and prepared within days — never warehoused for seasons.
          </p>
          <p>
            Our preparations follow classical Ayurvedic logic rather than marketing cycles. Where
            tradition pairs turmeric with pepper, or simmers bhringraj into coconut oil across an
            afternoon, we do the same. Innovation shows up in the parts you feel: consistency,
            safety, packaging, and the honesty of our labels.
          </p>
          <p>
            We make no medical claims. What we offer instead is provenance, patience, and products
            designed to be finished, studied, and loved before they are replaced.
          </p>
        </m.div>
      </section>

      <section className="bg-sand-300/40 py-24" aria-labelledby="values-heading">
        <div className="shell">
          <SectionHeading eyebrow="What guides us" title={<>Four quiet commitments</>} />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => (
              <m.article
                key={value.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: i * 0.07 }}
                className="rounded-3xl border border-forest-900/[0.07] bg-ivory-50 p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="grid size-12 place-items-center rounded-full bg-forest-900/[0.05] text-moss-600">
                  <value.icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="mt-5 font-display text-xl font-medium">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-900/65">{value.body}</p>
              </m.article>
            ))}
          </div>
          <p id="values-heading" className="sr-only">
            Our values
          </p>
        </div>
      </section>

      <section className="shell py-28 text-center">
        <m.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl font-display text-3xl leading-snug font-light sm:text-4xl"
        >
          "The forest does not hurry, and yet nothing is left undone."
        </m.p>
        <ButtonLink to="/products" variant="primary" size="lg" magnetic className="mt-10">
          Begin your ritual
        </ButtonLink>
        <p className="mt-6">
          <Link
            to="/journal"
            className="link-underline text-xs font-bold tracking-[0.14em] text-forest-900/65 uppercase"
          >
            Or read the Journal first
          </Link>
        </p>
      </section>
    </PageShell>
  )
}
