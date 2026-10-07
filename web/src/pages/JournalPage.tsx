import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useArticles } from '@/hooks/useCatalog'
import { formatDate } from '@/utils/format'
import { PageShell } from './PageShell'
import { useDocumentMeta } from '@/hooks'
import { fadeUp, viewportOnce } from '@/utils/motion'

const GRADIENTS = [
  'linear-gradient(135deg,#14291e,#24452f)',
  'linear-gradient(135deg,#8a5a1e,#c98a2d)',
  'linear-gradient(135deg,#2e4a38,#5d8266)',
  'linear-gradient(135deg,#31402c,#55663d)',
  'linear-gradient(135deg,#6e2f1e,#b3502a)',
]

export default function JournalPage() {
  useDocumentMeta(
    'The Journal — ARANYA',
    'Essays on Ayurveda, traditional Indian botanicals and the art of unhurried rituals.',
  )
  const { data: articles = [], isPending } = useArticles()
  const [lead, ...rest] = articles

  if (isPending) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell py-40 text-center">
          <p className="eyebrow animate-pulse text-forest-900/65">Opening the journal…</p>
        </div>
      </PageShell>
    )
  }

  if (!lead) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell py-40 text-center">
          <p className="font-display text-3xl font-medium">No essays yet</p>
          <p className="mt-3 text-sm text-forest-900/65">Our first piece is still being written.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-forest-950 to-forest-900 pt-40 pb-20 text-center text-ivory-50">
        <div className="shell">
          <p className="eyebrow text-bronze-400">The Journal</p>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl">
            Notes from the grove
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-sage-300/70">
            Essays on Ayurveda, botanical traditions and the quiet craft of daily rituals. Best read
            slowly.
          </p>
        </div>
      </header>

      <div className="shell py-16 pb-28">
        <m.article variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
          <Link
            to={`/journal/${lead.slug}`}
            className="group grid overflow-hidden rounded-[2rem] border hairline bg-ivory-100 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift lg:grid-cols-2"
          >
            <div className="relative min-h-64" style={{ background: GRADIENTS[0] }}>
              <svg
                viewBox="0 0 200 140"
                className="absolute inset-0 h-full w-full opacity-25 transition-transform duration-700 group-hover:scale-110"
                fill="none"
                stroke="#faf7f0"
                strokeWidth="0.7"
              >
                {Array.from({ length: 10 }).map((_, j) => (
                  <path
                    key={j}
                    d={`M${15 + j * 19} 150 C ${22 + j * 21} 90, ${8 + j * 17} 60, ${26 + j * 18} 10`}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>
            <div className="flex flex-col justify-center p-9 sm:p-12">
              <p className="eyebrow text-bronze-700">Latest · {lead.topic}</p>
              <h2 className="mt-4 font-display text-3xl leading-tight font-medium transition-colors group-hover:text-bronze-600 sm:text-4xl">
                {lead.title}
              </h2>
              <p className="mt-4 leading-relaxed text-forest-900/65">{lead.excerpt}</p>
              <p className="mt-6 flex items-center gap-3 text-xs font-semibold tracking-wide text-forest-900/65 uppercase">
                <time dateTime={lead.date}>{formatDate(lead.date)}</time>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} /> {lead.readTime}
                </span>
              </p>
            </div>
          </Link>
        </m.article>

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-10 grid gap-6 md:grid-cols-2"
        >
          {rest.map((article, i) => (
            <m.article key={article.slug} variants={fadeUp}>
              <Link
                to={`/journal/${article.slug}`}
                data-testid={`journal-${article.slug}`}
                className="group flex h-full flex-col rounded-3xl border hairline bg-ivory-100 p-8 transition-all duration-500 hover:-translate-y-1 hover:bg-ivory-50 hover:shadow-lift sm:p-10"
              >
                <span
                  className="inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-[0.16em] text-ivory-50 uppercase"
                  style={{ background: GRADIENTS[(i + 1) % GRADIENTS.length] }}
                >
                  {article.topic}
                </span>
                <h2 className="mt-5 font-display text-2xl leading-snug font-medium transition-colors group-hover:text-bronze-600">
                  {article.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-forest-900/65">
                  {article.excerpt}
                </p>
                <p className="mt-6 flex items-center gap-3 text-xs font-semibold tracking-wide text-forest-900/65 uppercase">
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {article.readTime}
                  </span>
                </p>
              </Link>
            </m.article>
          ))}
        </m.div>
      </div>
    </PageShell>
  )
}
