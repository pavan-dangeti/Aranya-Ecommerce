import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import { ArrowRight, Search, X } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { categoryName } from '@/data/categories'
import { formatPrice } from '@/utils/format'
import { useUi } from '@/store/uiStore'
import { useLockBodyScroll } from '@/hooks'
import { useDialog } from '@/hooks/useDialog'
import { cn } from '@/utils/cn'
import { EASE_ORGANIC } from '@/utils/motion'

export function SearchOverlay() {
  const open = useUi((s) => s.searchOpen)
  const close = useUi((s) => s.closeSearch)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Search-as-you-type against the real catalogue, so newly added products are
  // findable. Debounced so a burst of keystrokes is one request.
  const { data, isFetching } = useProducts({
    search: debounced.trim() || undefined,
    sort: 'featured',
    page: 1,
    pageSize: 7,
  })
  const hits = (debounced.trim() ? (data?.items ?? []) : []).map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    matched: debounced.trim(),
  }))

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(id)
  }, [query])

  useLockBodyScroll(open)
  const dialogRef = useDialog(open, close)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActiveIndex(0), [query])

  if (!open) return null

  const go = (slug: string) => {
    close()
    navigate(`/products/${slug}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && hits[activeIndex]) {
      // Focus returns to the header trigger on close; an unhandled Enter would click it and reopen search.
      e.preventDefault()
      go(hits[activeIndex].slug)
    }
  }

  return (
    <AnimatePresence>
      <m.div
        key="search-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        ref={dialogRef}
        className="fixed inset-0 z-70 flex items-start justify-center px-4 pt-[12vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
      >
        <button
          type="button"
          aria-label="Close search"
          onClick={close}
          className="absolute inset-0 cursor-pointer bg-forest-950/55 backdrop-blur-sm"
        />
        <m.div
          initial={{ opacity: 0, y: -14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.4, ease: EASE_ORGANIC }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-ivory-50 shadow-lift-lg"
        >
          <div className="flex items-center gap-3 border-b hairline px-5">
            <Search size={18} className="shrink-0 text-forest-900/65" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search herbs, rituals, products…"
              aria-label="Search products by name, category, ingredient or tag"
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="search-results"
              aria-activedescendant={hits[activeIndex] ? `hit-${activeIndex}` : undefined}
              className="h-14 w-full bg-transparent text-[15px] text-forest-900 outline-none placeholder:text-forest-900/35"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-forest-900/65 hover:bg-forest-900/[0.06]"
            >
              <X size={16} />
            </button>
          </div>

          {debounced.trim() && (
            <div
              id="search-results"
              role="listbox"
              aria-label="Results"
              className="max-h-[46vh] overflow-y-auto p-2"
            >
              {hits.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-forest-900/65">
                  {isFetching
                    ? 'Searching…'
                    : `Nothing in the grove matches “${debounced.trim()}”. Try “tulsi”, “hair” or “tea”.`}
                </p>
              ) : (
                hits.map((hit, i) => (
                  <button
                    key={hit.slug}
                    id={`hit-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(hit.slug)}
                    data-testid={`search-hit-${hit.slug}`}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                      i === activeIndex ? 'bg-forest-900/[0.06]' : '',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {highlight(hit.name, hit.matched)}
                      </span>
                      <span className="text-xs text-forest-900/65">
                        {categoryName(hit.category)} · from {formatPrice(hit.price)}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      className={cn(
                        'shrink-0 transition-opacity',
                        i === activeIndex ? 'opacity-60' : 'opacity-0',
                      )}
                    />
                  </button>
                ))
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="px-6 py-9">
              <p className="eyebrow mb-4 text-forest-900/65">Popular right now</p>
              <div className="flex flex-wrap gap-2">
                {['ashwagandha', 'tulsi', 'kumkumadi', 'hair oil', 'caffeine-free', 'sleep'].map(
                  (term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="cursor-pointer rounded-full border hairline border-forest-900/12 px-4 py-2 text-xs font-semibold text-forest-900/70 transition-all hover:border-bronze-500/60 hover:text-bronze-600"
                    >
                      {term}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-5 border-t hairline bg-forest-900/[0.03] px-5 py-2.5 text-[11px] text-forest-900/65">
            <span>
              <kbd className="font-sans font-bold">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-sans font-bold">↵</kbd> open
            </span>
            <span>
              <kbd className="font-sans font-bold">esc</kbd> close
            </span>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  )
}

function highlight(text: string, needle: string): React.ReactNode {
  const idx = text.toLowerCase().indexOf(needle.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-bronze-500/25 text-inherit">{text.slice(idx, idx + needle.length)}</mark>
      {text.slice(idx + needle.length)}
    </>
  )
}
