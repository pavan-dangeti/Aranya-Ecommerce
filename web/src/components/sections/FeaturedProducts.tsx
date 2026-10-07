import { Link } from 'react-router'
import { useFeaturedProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/loaders'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { fadeUp, viewportOnce } from '@/utils/motion'
import { m } from 'framer-motion'

export function FeaturedProducts() {
  const { data: products, isPending, isError } = useFeaturedProducts()

  return (
    <section className="bg-ivory-50 py-28 lg:py-36" aria-labelledby="featured-heading">
      <div className="shell">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow="Featured"
            title={
              <>
                The Apothecary's <em className="font-light text-bronze-500 italic">Favourites</em>
              </>
            }
            description="Small-batch preparations our community returns to season after season — each one traceable to the soil it came from."
            className="max-w-xl"
          />
          <m.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={viewportOnce}>
            <ButtonLink to="/products" variant="outline">
              View All Products
            </ButtonLink>
          </m.div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {isPending && Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          {products?.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
          {isError && (
            <p className="col-span-full rounded-2xl border border-clay-500/25 bg-clay-500/[0.05] p-6 text-center text-sm text-clay-600">
              The shelf didn't load this time.{' '}
              <button
                className="cursor-pointer font-bold underline"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>{' '}
              or browse the full{' '}
              <Link to="/products" className="font-bold underline">
                collection
              </Link>
              .
            </p>
          )}
        </div>

        <p id="featured-heading" className="sr-only">
          Featured herbal wellness products
        </p>
      </div>
    </section>
  )
}
