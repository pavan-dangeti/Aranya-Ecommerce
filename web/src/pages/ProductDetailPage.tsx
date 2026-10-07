import { lazy, useEffect, useMemo, useState, useId } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import { ChevronDown, Heart, MapPin, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { FREE_SHIPPING_THRESHOLD } from '@aranya/shared/constants'
import { categoryName } from '@/data/categories'
import { useFaqs } from '@/hooks/useCatalog'
import { formatEta, formatPrice, discountPercent, initials } from '@/utils/format'
import {
  useAddReview,
  useProduct,
  useProductReviews,
  useRelatedProducts,
} from '@/hooks/useProducts'
import { useCartView } from '@/hooks/useCartView'
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist'
import { useUi } from '@/store/uiStore'
import { PageShell } from './PageShell'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Rating } from '@/components/ui/Rating'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ProductVisual } from '@/components/products/ProductVisual'
import { ProductCard } from '@/components/products/ProductCard'
import { Scene3D } from '@/components/three/Scene3D'
import { ProductSceneFallback } from '@/components/three/fallbacks'
import { cn } from '@/utils/cn'
import { useDocumentMeta, useIsMobile, usePrefersReducedMotion } from '@/hooks'

const ProductScene = lazy(() =>
  import('@/components/three/ProductScene').then((m) => ({ default: m.ProductScene })),
)
import { EASE_ORGANIC, viewportOnce } from '@/utils/motion'
import { useAuth } from '@/hooks/useAuth'

type TabId = 'usage' | 'details' | 'faq'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isPending, isError } = useProduct(slug ?? '')
  const { data: allFaqs = [] } = useFaqs()
  const productFaqs = allFaqs.slice(0, 3)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<TabId>('usage')
  const isMobile = useIsMobile()
  const reduced = usePrefersReducedMotion()
  const navigate = useNavigate()

  const { add } = useCartView()
  const openCart = useUi((s) => s.openCart)
  const { mutate: toggleWishlist } = useToggleWishlist()
  const wishlisted = useIsInWishlist(product?.id ?? '')

  useEffect(() => {
    setQty(1)
  }, [slug])

  useDocumentMeta(product ? `${product.name} — ARANYA` : 'ARANYA', product?.shortDescription)

  useEffect(() => {
    if (!product) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'ld-product'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription,
      category: categoryName(product.category),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability:
          product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    })
    document.head.appendChild(script)
    return () => {
      document.getElementById('ld-product')?.remove()
    }
  }, [product])

  if (isPending) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell grid gap-10 pt-40 pb-24 lg:grid-cols-2 lg:gap-16">
          <div className="aspect-square animate-pulse rounded-[2rem] bg-forest-900/[0.06]" />
          <div className="space-y-5 pt-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-5 animate-pulse rounded-full bg-forest-900/[0.06]"
                style={{ width: `${90 - i * 11}%` }}
              />
            ))}
          </div>
        </div>
      </PageShell>
    )
  }

  if (isError || (!isPending && !product)) {
    return <Navigate to="/products" replace />
  }

  const discount = discountPercent(product.price, product.compareAtPrice)
  const lowStock = product.stock <= 20

  return (
    <PageShell className="bg-ivory-50 pb-24">
      <nav aria-label="Breadcrumb" className="border-b hairline pt-28 pb-5">
        <ol className="shell flex items-center gap-2 text-xs text-forest-900/65">
          <li>
            <Link to="/" className="hover:text-forest-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/products" className="hover:text-forest-900">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={`/products?cat=${product.category}`} className="hover:text-forest-900">
              {categoryName(product.category)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-semibold text-forest-900">
            {product.name}
          </li>
        </ol>
      </nav>

      <section className="shell grid gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-16">
        <div className="relative">
          <div
            data-testid="product-stage"
            className="sticky top-24 aspect-square overflow-hidden rounded-[2rem] border hairline bg-gradient-to-b from-ivory-100 to-ivory-200/70"
          >
            {!isMobile ? (
              <Scene3D
                className="h-full w-full"
                fallback={
                  <ProductSceneFallback
                    glass={product.visual.glass}
                    accent={product.visual.accent}
                  />
                }
              >
                {(active) => (
                  <ProductScene
                    active={active}
                    reducedMotion={Boolean(reduced)}
                    palette={{ glass: product.visual.glass, accent: product.visual.accent }}
                  />
                )}
              </Scene3D>
            ) : (
              <div className="grid h-full place-items-center p-8">
                <ProductVisual {...product.visual} name={product.name} />
              </div>
            )}
            {!isMobile && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-forest-950/55 px-4 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-ivory-50/80 uppercase backdrop-blur-md">
                Drag to explore
              </span>
            )}
          </div>
        </div>

        <m.div
          initial={{ y: 28 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, ease: EASE_ORGANIC }}
        >
          <p className="eyebrow text-bronze-700">{categoryName(product.category)}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <Rating value={product.rating} showValue count={product.reviewCount} size={15} />
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-semibold">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-lg text-forest-900/65 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="rounded-full bg-clay-500/10 px-3 py-1 text-xs font-bold text-clay-600">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-forest-900/65">
            {product.shortDescription}
          </p>

          <ul className="mt-7 space-y-2.5 border-y hairline py-6">
            {product.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-forest-900/75">
                <Sparkles
                  size={15}
                  className="mt-0.5 shrink-0 text-bronze-500"
                  aria-hidden="true"
                />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={(v) => setQty(Math.max(1, Math.min(v, 10)))} />
            <Button
              variant="primary"
              magnetic
              data-testid="pdp-add-to-cart"
              onClick={() => {
                add(product.id, qty)
                openCart()
              }}
            >
              <ShoppingBag size={15} /> Add to Cart
            </Button>
            <Button
              variant="bronze"
              onClick={() => {
                add(product.id, qty)
                navigate('/checkout')
              }}
            >
              Buy Now
            </Button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              data-testid="pdp-wishlist"
              className={cn(
                'grid size-12 cursor-pointer place-items-center rounded-full border transition-all',
                wishlisted
                  ? 'border-clay-500 bg-clay-500 text-ivory-50'
                  : 'hairline text-forest-900/65 hover:border-clay-500 hover:text-clay-500',
              )}
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={1.8} />
            </button>
          </div>

          {lowStock && (
            <p
              className="mt-4 text-xs font-bold tracking-wide text-bronze-700 uppercase"
              role="status"
            >
              Only {product.stock} jars left in this batch
            </p>
          )}

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoTile icon={MapPin} title="Origin" body={product.origin} />
            <InfoTile
              icon={Truck}
              title="Delivery"
              body={`Arrives by ${formatEta(5)} · Free over ₹${FREE_SHIPPING_THRESHOLD}`}
            />
          </div>
        </m.div>
      </section>

      {isMobile && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-ivory-50/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg"
          data-testid="mobile-purchase-bar"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{product.name}</p>
              <p className="text-sm font-bold">{formatPrice(product.price)}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              data-testid="mobile-add-to-cart"
              onClick={() => {
                add(product.id, qty)
                openCart()
              }}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      )}

      <section className="border-t hairline bg-ivory-100/60 py-20" aria-label="Product information">
        <div className="shell max-w-3xl">
          <TabBar
            tabs={[
              { id: 'usage', label: 'How to Use' },
              { id: 'details', label: 'Ingredients & Details' },
              { id: 'faq', label: 'FAQ' },
            ]}
            active={tab}
            onChange={setTab}
          />

          <AnimatePresence mode="wait">
            <m.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE_ORGANIC }}
              className="mt-10"
            >
              {tab === 'usage' && (
                <div className="space-y-8">
                  <Prose heading="Ritual of use">{product.usage}</Prose>
                  <Prose heading="Traditional context">
                    Where we describe tradition, we are honouring recorded practice — not promising
                    outcomes. Herbs walk alongside good sleep, honest food and steady movement; they
                    don't replace them.
                  </Prose>
                </div>
              )}

              {tab === 'details' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-display text-xl font-medium">Full ingredient list</h3>
                    <ul className="mt-4 divide-y divide-forest-900/[0.07] rounded-2xl border hairline bg-ivory-50">
                      {product.ingredients.map((ing) => (
                        <li
                          key={ing.name}
                          className="flex items-center justify-between gap-4 px-6 py-4"
                        >
                          <span className="text-sm font-semibold">{ing.name}</span>
                          <span className="text-xs tracking-wide text-forest-900/65 italic">
                            {ing.note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Prose heading="About this preparation">{product.description}</Prose>
                  <Prose heading="Storage">
                    Keep sealed, dry and away from direct sunlight. Best within the date printed on
                    the base.
                  </Prose>
                </div>
              )}

              {tab === 'faq' && (
                <Accordion items={productFaqs.map((f) => ({ q: f.question, a: f.answer }))} />
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </section>

      <ReviewsSection productId={product.id} rating={product.rating} count={product.reviewCount} />

      <RelatedProducts slug={product.slug} category={product.category} />
    </PageShell>
  )
}

function InfoTile({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof MapPin
  title: string
  body: string
}) {
  return (
    <div className="flex gap-4 rounded-2xl border hairline bg-ivory-100/70 p-5">
      <Icon
        size={19}
        className="mt-0.5 shrink-0 text-moss-600"
        strokeWidth={1.7}
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-forest-900/65 uppercase">{title}</p>
        <p className="mt-1 text-sm font-semibold text-forest-900/80">{body}</p>
      </div>
    </div>
  )
}

function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: TabId; label: string }>
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Product information sections"
      className="flex flex-wrap justify-center gap-2"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'cursor-pointer rounded-full px-6 py-3 text-xs font-bold tracking-[0.14em] uppercase transition-all duration-300',
            active === t.id
              ? 'bg-forest-900 text-ivory-50 shadow-lift'
              : 'bg-forest-900/[0.05] text-forest-900/65 hover:bg-forest-900/[0.09]',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function Prose({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xl font-medium">{heading}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-forest-900/65">{children}</p>
    </div>
  )
}

function Accordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const uid = useId()
  return (
    <ul className="divide-y divide-forest-900/[0.08] rounded-2xl border hairline bg-ivory-50">
      {items.map((item, i) => {
        const open = openIndex === i
        return (
          <li key={item.q}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`acc-${uid}-${i}`}
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-sm font-semibold">{item.q}</span>
              <ChevronDown
                size={16}
                className={cn('shrink-0 transition-transform duration-300', open && 'rotate-180')}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <m.div
                  id={`acc-${uid}-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_ORGANIC }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed text-forest-900/65">{item.a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}

function ReviewsSection({
  productId,
  rating,
  count,
}: {
  productId: string
  rating: number
  count: number
}) {
  const { data: reviews, isPending: reviewsPending } = useProductReviews(productId)
  const addReview = useAddReview()
  const { data: user } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ rating: 5, title: '', body: '' })

  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]
    for (const r of reviews ?? []) buckets[Math.min(4, Math.max(0, Math.floor(r.rating) - 1))]! += 1
    const total = reviews?.length || 1
    return buckets.reverse().map((b) => Math.round((b / total) * 100))
  }, [reviews])

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.title.trim() || !form.body.trim()) return
    await addReview.mutateAsync({
      productId,
      location: 'India',
      rating: form.rating,
      title: form.title.trim(),
      body: form.body.trim(),
    })
    setFormOpen(false)
    setForm({ rating: 5, title: '', body: '' })
  }

  return (
    <section className="border-t hairline py-20" aria-labelledby="reviews-heading">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading align="left" eyebrow="Community" title="Reviews" className="max-w-md" />
          {user ? (
            <Button variant="outline" onClick={() => setFormOpen((o) => !o)}>
              {formOpen ? 'Close' : 'Write a review'}
            </Button>
          ) : (
            <Link
              to="/login/customer"
              className="link-underline text-xs font-bold tracking-[0.14em] uppercase"
            >
              Sign in to review
            </Link>
          )}
        </div>

        <p id="reviews-heading" className="sr-only">
          Product reviews
        </p>

        <AnimatePresence>
          {formOpen && user && (
            <m.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={submitReview}
              className="mx-auto mt-8 max-w-xl space-y-4 overflow-hidden rounded-2xl border hairline bg-ivory-100/70 p-6"
            >
              <fieldset>
                <legend className="mb-2 text-xs font-bold tracking-[0.14em] uppercase">
                  Your rating
                </legend>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={form.rating === star}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      onClick={() => setForm((f) => ({ ...f, rating: star }))}
                      className={cn(
                        'cursor-pointer text-2xl transition-transform hover:scale-110',
                        star <= form.rating ? 'text-bronze-500' : 'text-forest-900/15',
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </fieldset>
              <input
                required
                placeholder="Sum it up in a line"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border hairline bg-ivory-50 px-4 py-3 text-sm outline-none focus:border-bronze-500"
                aria-label="Review title"
              />
              <textarea
                required
                rows={4}
                placeholder="How does it sit in your routine?"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="w-full resize-none rounded-xl border hairline bg-ivory-50 px-4 py-3 text-sm outline-none focus:border-bronze-500"
                aria-label="Review body"
              />
              <Button type="submit" variant="primary">
                Publish review
              </Button>
            </m.form>
          )}
        </AnimatePresence>

        <div className="mt-12 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div className="rounded-3xl border hairline bg-ivory-100/70 p-7 text-center">
            <p className="font-display text-6xl font-medium">{rating.toFixed(1)}</p>
            <Rating value={rating} size={16} className="mt-3 justify-center" />
            <p className="mt-2 text-xs text-forest-900/65">
              {count.toLocaleString('en-IN')} ratings on this blend
            </p>
            <div className="mt-6 space-y-2" role="presentation">
              {distribution.map((pct, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-forest-900/65">
                  <span className="w-6 text-right">{5 - i}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-900/[0.07]">
                    <div
                      className="h-full rounded-full bg-bronze-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8">{pct}%</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-left text-[10px] leading-relaxed text-forest-900/65">
              Reviews are published only after moderation.
            </p>
          </div>

          <ul className="space-y-5">
            {(reviews ?? []).map((review) => (
              <li
                key={review.id}
                data-testid="review-item"
                className="rounded-3xl border hairline bg-ivory-100/50 p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="grid size-11 place-items-center rounded-full bg-forest-900/[0.06] font-display text-sm font-semibold text-moss-600"
                    >
                      {initials(review.author)}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{review.author}</p>
                      <p className="text-xs text-forest-900/65">{review.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Rating value={review.rating} size={13} />
                    <time dateTime={review.date} className="block text-[11px] text-forest-900/65">
                      {new Date(review.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
                <h4 className="mt-4 font-display text-lg font-medium">{review.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-forest-900/65">{review.body}</p>
              </li>
            ))}
            {reviewsPending &&
              [...Array(2)].map((_, i) => (
                <li key={i} className="h-36 animate-pulse rounded-3xl bg-forest-900/[0.05]" />
              ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function RelatedProducts({ slug, category }: { slug: string; category: string }) {
  const { data: related } = useRelatedProducts(slug, 3)

  if (!related?.length) return null

  return (
    <section className="border-t hairline bg-ivory-100/60 py-20" aria-labelledby="related-heading">
      <div className="shell">
        <SectionHeading eyebrow="Continue the ritual" title="Pairs well with" />
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-12 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
        >
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </m.div>
        <p className="sr-only" id="related-heading">
          Related products in {categoryName(category)}
        </p>
      </div>
    </section>
  )
}
