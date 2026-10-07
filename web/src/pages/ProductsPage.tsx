import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import type { CategoryId, PagedProducts, SortOption } from '@/types'
import { useCategories } from '@/hooks/useCatalog'
import { productApi } from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/loaders'
import { PageShell } from './PageShell'
import { useDocumentMeta } from '@/hooks'
import { useDialog } from '@/hooks/useDialog'
import { cn } from '@/utils/cn'
import { EASE_ORGANIC, fadeUp } from '@/utils/motion'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

const PAGE_SIZE = 9

function parseParams(sp: URLSearchParams) {
  return {
    search: sp.get('q') ?? undefined,
    categories: (sp.get('cat')?.split(',').filter(Boolean) ?? []) as CategoryId[],
    minPrice: sp.get('min') ? Number(sp.get('min')) : undefined,
    maxPrice: sp.get('max') ? Number(sp.get('max')) : undefined,
    minRating: sp.get('rating') ? Number(sp.get('rating')) : undefined,
    sort: (sp.get('sort') as SortOption | null) ?? 'featured',
  }
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseParams(searchParams), [searchParams])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PagedProducts | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const filtersRef = useDialog(mobileFiltersOpen, () => setMobileFiltersOpen(false))
  const queryKey = JSON.stringify(filters)

  useDocumentMeta(
    'Shop All — ARANYA Herbal Wellness',
    'Browse the full Aranya apothecary: herbal supplements, skin care, hair care, wellness blends and tisanes.',
  )

  useEffect(() => {
    setPage(1)
  }, [queryKey])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    productApi
      .query({ ...filters, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!mounted) return
        setResult(res)
        setLoading(false)
      })
      .catch(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [queryKey, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const toggleCategory = (id: CategoryId) => {
    const current = filters.categories.includes(id)
      ? filters.categories.filter((c) => c !== id)
      : [...filters.categories, id]
    patchParams({ cat: current.join(',') || null })
  }

  const activeFilterCount =
    filters.categories.length +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.minRating != null ? 1 : 0)

  const visibleItems = loading && !result ? [] : result!.items

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-ivory-100 to-ivory-50 pt-36 pb-14">
        <div className="shell">
          <m.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="eyebrow text-bronze-700"
          >
            The Apothecary
          </m.p>
          <m.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.08 }}
            className="mt-3 font-display text-5xl font-medium tracking-tight sm:text-6xl"
          >
            All Products
          </m.h1>
          <m.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.16 }}
            className="mt-4 max-w-lg text-[15px] leading-relaxed text-forest-900/65"
          >
            Every preparation in the collection — traceable to its farm, milled in small batches,
            and honest about what's inside.
          </m.p>
        </div>
      </header>

      <div className="shell grid gap-10 py-12 lg:grid-cols-[240px_1fr] lg:gap-14">
        <aside aria-label="Product filters" className="hidden lg:block">
          <FilterPanel filters={filters} onToggleCategory={toggleCategory} onPatch={patchParams} />
        </aside>

        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border hairline bg-ivory-100 px-5 py-4 text-sm font-semibold"
            aria-expanded={mobileFiltersOpen}
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-bronze-500 text-[10px] font-bold text-forest-950">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown size={16} />
          </button>

          <AnimatePresence>
            {mobileFiltersOpen && (
              <div
                ref={filtersRef}
                className="fixed inset-0 z-60"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
              >
                <m.button
                  type="button"
                  aria-label="Close filters"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute inset-0 cursor-pointer bg-forest-950/45 backdrop-blur-[3px]"
                />
                <m.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: 0.45, ease: EASE_ORGANIC }}
                  className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-ivory-50 p-6 pb-10"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-xl font-medium">Refine</h2>
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen(false)}
                      aria-label="Close filters"
                      className="grid size-9 cursor-pointer place-items-center rounded-full hover:bg-forest-900/[0.06]"
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <FilterPanel
                    filters={filters}
                    onToggleCategory={toggleCategory}
                    onPatch={patchParams}
                  />
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="mt-8 w-full cursor-pointer rounded-full bg-forest-900 py-4 text-xs font-bold tracking-[0.14em] text-ivory-50 uppercase"
                  >
                    Show {result?.total ?? 0} results
                  </button>
                </m.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <section aria-label="Products" aria-busy={loading}>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-forest-900/65" role="status">
              {loading ? 'Gathering herbs…' : `${result?.total ?? 0} preparations`}
              {filters.search ? ` matching “${filters.search}”` : ''}
            </p>
            <div className="flex items-center gap-3">
              <label
                htmlFor="sort"
                className="text-xs font-semibold tracking-wide text-forest-900/65 uppercase"
              >
                Sort
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => patchParams({ sort: e.target.value })}
                className="cursor-pointer rounded-full border hairline bg-ivory-50 px-4 py-2.5 text-sm font-semibold outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {loading && !result
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : visibleItems.map((product, i) => (
                  <ProductCard key={`${product.id}-${page}`} product={product} index={i} />
                ))}
          </div>

          {!loading && visibleItems.length === 0 && (
            <div className="rounded-3xl border hairline bg-ivory-100 p-16 text-center">
              <h2 className="font-display text-2xl font-medium">Nothing grows here yet</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-forest-900/65">
                No products match this combination of filters. Loosen the soil a little.
              </p>
              <button
                type="button"
                onClick={() => setSearchParams({}, { replace: true })}
                className="mt-7 cursor-pointer rounded-full bg-forest-900 px-7 py-3 text-xs font-bold tracking-[0.14em] text-ivory-50 uppercase"
              >
                Clear all filters
              </button>
            </div>
          )}

          {result && page < result.totalPages && (
            <div className="mt-16 text-center">
              <button
                type="button"
                data-testid="load-more"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="cursor-pointer rounded-full border border-forest-900/25 px-9 py-4 text-xs font-bold tracking-[0.16em] uppercase transition-all hover:border-forest-900 hover:bg-forest-900 hover:text-ivory-50 disabled:opacity-40"
              >
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  )
}

interface FilterPanelProps {
  filters: ReturnType<typeof parseParams>
  onToggleCategory: (id: CategoryId) => void
  onPatch: (patch: Record<string, string | null>) => void
}

function FilterPanel({ filters, onToggleCategory, onPatch }: FilterPanelProps) {
  const { data: categories = [] } = useCategories()
  const [minInput, setMinInput] = useState(filters.minPrice?.toString() ?? '')
  const [maxInput, setMaxInput] = useState(filters.maxPrice?.toString() ?? '')

  useEffect(() => {
    setMinInput(filters.minPrice?.toString() ?? '')
    setMaxInput(filters.maxPrice?.toString() ?? '')
  }, [filters.minPrice, filters.maxPrice])

  return (
    <div className="space-y-9">
      <fieldset>
        <legend className="eyebrow mb-4 text-forest-900/65">Category</legend>
        <ul className="space-y-2.5">
          {categories.map((cat) => (
            <li key={cat.id}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-forest-900/75 transition-colors hover:text-forest-900">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.id)}
                  onChange={() => onToggleCategory(cat.id)}
                  className="size-4 cursor-pointer appearance-none rounded-[5px] border border-forest-900/30 transition-colors checked:border-forest-900 checked:bg-forest-900 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22M3%208.5l3.5%203.5L13%205%22/%3E%3C/svg%3E')] checked:bg-center checked:bg-no-repeat"
                />
                {cat.name}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4 text-forest-900/65">Price</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onPatch({
              min: minInput === '' ? null : String(Math.max(0, Number(minInput))),
              max: maxInput === '' ? null : String(Number(maxInput)),
            })
          }}
        >
          <label className="sr-only" htmlFor="price-min">
            Minimum price
          </label>
          <input
            id="price-min"
            inputMode="numeric"
            placeholder="₹ Min"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value.replace(/[^\d]/g, ''))}
            className="h-11 w-full rounded-xl border hairline bg-ivory-50 px-3.5 text-sm outline-none focus:border-bronze-500"
          />
          <span aria-hidden="true" className="text-forest-900/30">
            –
          </span>
          <label className="sr-only" htmlFor="price-max">
            Maximum price
          </label>
          <input
            id="price-max"
            inputMode="numeric"
            placeholder="₹ Max"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value.replace(/[^\d]/g, ''))}
            className="h-11 w-full rounded-xl border hairline bg-ivory-50 px-3.5 text-sm outline-none focus:border-bronze-500"
          />
          <button
            type="submit"
            className="shrink-0 cursor-pointer rounded-xl bg-forest-900 px-4 py-2.5 text-xs font-bold text-ivory-50"
          >
            Go
          </button>
        </form>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4 text-forest-900/65">Rating</legend>
        <div className="flex flex-wrap gap-2">
          {[4.5, 4, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onPatch({ rating: filters.minRating === r ? null : String(r) })}
              aria-pressed={filters.minRating === r}
              className={cn(
                'cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                filters.minRating === r
                  ? 'border-bronze-500 bg-bronze-500/15 text-bronze-700'
                  : 'hairline text-forest-900/65 hover:border-bronze-500/50',
              )}
            >
              ★ {r}+
            </button>
          ))}
        </div>
      </fieldset>

      {activeFilterCount(filters) > 0 && (
        <button
          type="button"
          onClick={() => onPatch({ cat: null, min: null, max: null, rating: null })}
          className="link-underline cursor-pointer text-xs font-bold tracking-wide text-clay-600 uppercase"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

function activeFilterCount(f: ReturnType<typeof parseParams>): number {
  return (
    f.categories.length +
    (f.minPrice != null ? 1 : 0) +
    (f.maxPrice != null ? 1 : 0) +
    (f.minRating != null ? 1 : 0)
  )
}
