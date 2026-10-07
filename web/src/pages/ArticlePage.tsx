import { Link, Navigate, useParams } from 'react-router'
import { m } from 'framer-motion'
import { ArrowLeft, Clock } from 'lucide-react'
import { useArticle, useArticles } from '@/hooks/useCatalog'
import { formatDate } from '@/utils/format'
import { PageShell } from './PageShell'
import { useDocumentMeta } from '@/hooks'
import { fadeUp } from '@/utils/motion'

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: article, isPending, isError } = useArticle(slug ?? '')
  const { data: allArticles = [] } = useArticles()
  const others = allArticles.filter((a) => a.slug !== slug).slice(0, 2)

  useDocumentMeta(
    article ? `${article.title} — The Aranya Journal` : 'The Journal — ARANYA',
    article?.excerpt,
  )

  // Redirecting while the query is still in flight would bounce real readers away.
  if (isPending) return null
  if (isError || !article) return <Navigate to="/journal" replace />

  return (
    <PageShell className="bg-ivory-50">
      <header className="relative overflow-hidden bg-forest-950 pt-40 pb-24 text-center text-ivory-50">
        <div
          aria-hidden="true"
          className="absolute top-[-30%] left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,#1b3527_0%,transparent_65%)]"
        />
        <m.div variants={fadeUp} initial="hidden" animate="visible" className="shell relative">
          <Link
            to="/journal"
            className="link-underline mx-auto inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-sage-300/70 uppercase"
          >
            <ArrowLeft size={13} /> All essays
          </Link>
          <p className="eyebrow mt-8 text-bronze-400">{article.topic}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-6xl">
            {article.title}
          </h1>
          <p className="mt-6 flex items-center justify-center gap-3 text-xs font-semibold tracking-wide text-sage-300/70 uppercase">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} /> {article.readTime}
            </span>
          </p>
        </m.div>
      </header>

      <article className="shell max-w-3xl pt-16 pb-20">
        {article.sections.map((section, i) => (
          <m.section
            key={i}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className={i === 0 ? '' : 'mt-14'}
          >
            {section.heading && (
              <h2 className="font-display text-2xl font-medium sm:text-3xl">{section.heading}</h2>
            )}
            {section.paragraphs.map((paragraph, j) => (
              <p
                key={j}
                className={`leading-[1.85] text-forest-900/75 ${section.heading || j > 0 ? 'mt-5' : 'text-lg'} first-letter:${
                  i === 0 && j === 0
                    ? 'float-left mr-3 mt-1 font-display text-6xl leading-[0.8] font-medium text-bronze-700'
                    : ''
                }`}
              >
                {paragraph}
              </p>
            ))}

            {i === 1 && (
              <blockquote className="my-10 border-l-2 border-bronze-500 pl-7 font-display text-2xl leading-snug font-light text-forest-800 italic sm:text-[1.7rem]">
                “{article.pullQuote}”
              </blockquote>
            )}
          </m.section>
        ))}
      </article>

      <aside className="border-t hairline bg-ivory-100/60 py-16" aria-label="Continue reading">
        <div className="shell max-w-4xl">
          <h2 className="eyebrow mb-8 text-center text-bronze-700">Continue reading</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {others.map((other) => (
              <Link
                key={other.slug}
                to={`/journal/${other.slug}`}
                className="group rounded-3xl border hairline bg-ivory-50 p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
              >
                <p className="eyebrow text-bronze-700">{other.topic}</p>
                <h3 className="mt-3 font-display text-xl leading-snug font-medium transition-colors group-hover:text-bronze-600">
                  {other.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-forest-900/65">{other.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </PageShell>
  )
}
