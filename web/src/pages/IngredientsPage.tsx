import { Link } from 'react-router'
import { m } from 'framer-motion'
import { useIngredients } from '@/hooks/useCatalog'
import { useProducts } from '@/hooks/useProducts'
import { formatPrice } from '@/utils/format'
import { PageShell } from './PageShell'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useDocumentMeta } from '@/hooks'
import { viewportOnce } from '@/utils/motion'

export default function IngredientsPage() {
  const { data: ingredients = [] } = useIngredients()
  // "Found in" links show a product name and price, so we need the whole
  // catalogue once rather than the paginated shop view.
  const { data: catalogue } = useProducts({ page: 1, pageSize: 48 })
  const productBySlug = new Map((catalogue?.items ?? []).map((p) => [p.slug, p]))

  useDocumentMeta(
    'Ingredients — ARANYA',
    'Meet the six botanicals at the heart of Aranya: ashwagandha, neem, turmeric, tulsi, amla and brahmi.',
  )

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-forest-950 to-forest-900 pt-40 pb-24 text-center text-ivory-50">
        <div className="shell">
          <p className="eyebrow text-bronze-400">The Materia Medica</p>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl">
            Six botanicals, chosen for life
          </h1>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-sage-300/70">
            The core of our apothecary — each with its own soil, season and story in Indian
            tradition.
          </p>
        </div>
      </header>

      <div className="shell grid gap-6 py-16 pb-28 md:grid-cols-2 xl:grid-cols-3">
        {ingredients.map((ingredient, i) => (
          <m.article
            key={ingredient.id}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: (i % 3) * 0.08 }}
            data-testid={`ingredient-${ingredient.id}`}
            className="group relative flex flex-col overflow-hidden rounded-3xl border hairline bg-ivory-100 p-8 transition-all duration-500 hover:-translate-y-1.5 hover:bg-ivory-50 hover:shadow-lift"
          >
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 size-44 rounded-full blur-2xl transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle, ${ingredient.palette.accent}26, transparent 70%)`,
                opacity: 0.5,
              }}
            />
            <div className="relative">
              <span
                aria-hidden="true"
                className="font-display text-lg italic"
                style={{
                  color:
                    ingredient.palette.accent === '#a9824e' ? '#8f6b3f' : ingredient.palette.deep,
                }}
              >
                {ingredient.sanskritName}
              </span>
              <h2 className="mt-3 font-display text-3xl font-medium">{ingredient.name}</h2>
              <p className="mt-1 text-sm tracking-wide text-forest-900/65 italic">
                {ingredient.latinName}
              </p>

              <p className="mt-5 text-sm leading-relaxed text-forest-900/65">
                {ingredient.description}
              </p>

              <dl className="mt-6 space-y-2 border-t hairline pt-5 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-forest-900/65">Grown in</dt>
                  <dd className="text-right font-semibold">{ingredient.origin}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-forest-900/65">Tradition</dt>
                  <dd className="text-right font-semibold">{ingredient.traditionalCategory}</dd>
                </div>
              </dl>

              {ingredient.foundIn.length > 0 && (
                <div className="mt-6 border-t hairline pt-5">
                  <p className="eyebrow mb-3 text-forest-900/65">Found in</p>
                  <ul className="flex flex-wrap gap-2">
                    {ingredient.foundIn.map((slug) => {
                      const product = productBySlug.get(slug)
                      if (!product) return null
                      return (
                        <li key={slug}>
                          <Link
                            to={`/products/${slug}`}
                            className="inline-block rounded-full border hairline px-3.5 py-1.5 text-xs font-semibold transition-all hover:border-bronze-500 hover:text-bronze-600"
                          >
                            {product.name} · {formatPrice(product.price)}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </m.article>
        ))}
      </div>

      <section className="border-t hairline bg-ivory-100/60 py-20 text-center">
        <SectionHeading
          eyebrow="Go deeper"
          title="Curious how these herbs work together?"
          description="Our journal follows the traditions behind every blend — no claims, just stories worth steeping on."
        />
        <Link
          to="/journal"
          className="mt-9 inline-block cursor-pointer rounded-full bg-forest-900 px-9 py-4 text-xs font-bold tracking-[0.16em] text-ivory-50 uppercase transition-colors hover:bg-forest-700"
        >
          Read the Journal
        </Link>
      </section>
    </PageShell>
  )
}
