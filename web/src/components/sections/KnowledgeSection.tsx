import { Link } from 'react-router'
import { m } from 'framer-motion'
import { ArrowUpRight, Clock } from 'lucide-react'
import { useArticles } from '@/hooks/useCatalog'
import { formatDate } from '@/utils/format'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { fadeUp, viewportOnce } from '@/utils/motion'

export function KnowledgeSection() {
  const { data: articles = [] } = useArticles()
  const preview = articles.slice(0, 3)

  return (
    <section className="bg-ivory-100 py-28 lg:py-36" aria-labelledby="knowledge-heading">
      <div className="shell">
        <SectionHeading
          eyebrow="The Journal"
          title={
            <>
              Understand Your <em className="font-light text-bronze-500 italic">Herbs</em>
            </>
          }
          description="Essays on Ayurveda, botanical traditions, and the art of the unhurried ritual — written to be read with a cup of tulsi in hand."
        />

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {preview.map((article, i) => (
            <m.article key={article.slug} variants={fadeUp} className="h-full">
              <Link
                to={`/journal/${article.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border hairline bg-ivory-50 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift"
              >
                <div
                  aria-hidden="true"
                  className="relative h-44 overflow-hidden"
                  style={{
                    background:
                      i === 0
                        ? 'linear-gradient(135deg,#14291e,#24452f)'
                        : i === 1
                          ? 'linear-gradient(135deg,#8a5a1e,#c98a2d)'
                          : 'linear-gradient(135deg,#2e4a38,#5d8266)',
                  }}
                >
                  <svg
                    viewBox="0 0 200 140"
                    className="absolute inset-0 h-full w-full opacity-25 transition-transform duration-700 group-hover:scale-110"
                    fill="none"
                    stroke="#faf7f0"
                    strokeWidth="0.7"
                  >
                    {Array.from({ length: 9 }).map((_, j) => (
                      <path
                        key={j}
                        d={`M${20 + j * 20} 150 C ${26 + j * 22} 90, ${10 + j * 18} 60, ${30 + j * 19} 10`}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
                  <span className="absolute top-4 left-4 rounded-full bg-ivory-50/12 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-ivory-50 uppercase backdrop-blur-sm">
                    {article.topic}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-3 text-[11px] font-semibold tracking-wide text-forest-900/65 uppercase">
                    <time dateTime={article.date}>{formatDate(article.date)}</time>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {article.readTime}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-xl leading-snug font-medium transition-colors group-hover:text-bronze-600">
                    {article.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-forest-900/65">
                    {article.excerpt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-bold tracking-[0.14em] text-forest-900 uppercase transition-colors group-hover:text-bronze-600">
                    Read essay{' '}
                    <ArrowUpRight
                      size={13}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </div>
              </Link>
            </m.article>
          ))}
        </m.div>

        <p id="knowledge-heading" className="sr-only">
          Ayurvedic knowledge and journal
        </p>
      </div>
    </section>
  )
}
