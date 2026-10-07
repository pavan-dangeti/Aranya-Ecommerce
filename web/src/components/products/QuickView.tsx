import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import { useUi } from '@/store/uiStore'
import { useCartView } from '@/hooks/useCartView'
import { useProduct } from '@/hooks/useProducts'
import { formatPrice, discountPercent } from '@/utils/format'
import { useLockBodyScroll } from '@/hooks'
import { useDialog } from '@/hooks/useDialog'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Rating } from '@/components/ui/Rating'
import { ProductVisual } from './ProductVisual'
import { EASE_ORGANIC } from '@/utils/motion'

export function QuickView() {
  const slug = useUi((s) => s.quickViewSlug)
  const setQuickView = useUi((s) => s.setQuickView)
  const { add } = useCartView()
  const openCart = useUi((s) => s.openCart)
  const [qty, setQty] = useState(1)
  const { data: product } = useProduct(slug ?? '')

  const open = Boolean(slug && product)
  const close = () => {
    setQuickView(null)
    setQty(1)
  }

  useLockBodyScroll(open)
  const dialogRef = useDialog(open, close)

  return (
    <AnimatePresence>
      {open && product && (
        <m.div
          ref={dialogRef}
          key="quickview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-60 grid place-items-center overflow-y-auto p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view — ${product.name}`}
        >
          <button
            type="button"
            aria-label="Close quick view"
            onClick={close}
            className="fixed inset-0 cursor-pointer bg-forest-950/50 backdrop-blur-sm"
          />
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.45, ease: EASE_ORGANIC }}
            className="relative grid w-full max-w-3xl gap-8 overflow-hidden rounded-3xl bg-ivory-50 p-6 shadow-lift-lg sm:p-9 md:grid-cols-[240px_1fr]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close quick view"
              className="absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-forest-900/[0.06]"
            >
              <X size={17} />
            </button>

            <div className="mx-auto w-full max-w-[240px] self-center">
              <ProductVisual {...product.visual} name={product.name} />
            </div>

            <div className="min-w-0">
              <p className="eyebrow text-bronze-700">Quick View</p>
              <h2 className="mt-2 font-display text-3xl leading-tight font-medium">
                {product.name}
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <Rating value={product.rating} showValue count={product.reviewCount} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-forest-900/65">
                {product.shortDescription}
              </p>

              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-2xl font-semibold">
                  {formatPrice(product.price)}
                </span>
                {discountPercent(product.price, product.compareAtPrice) && (
                  <>
                    <span className="text-sm text-forest-900/65 line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <span className="rounded-full bg-clay-500/10 px-2.5 py-1 text-[11px] font-bold text-clay-600">
                      Save {discountPercent(product.price, product.compareAtPrice)}%
                    </span>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <QuantityStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />
                <Button
                  variant="primary"
                  onClick={() => {
                    add(product.id, qty)
                    close()
                    openCart()
                  }}
                >
                  Add to Cart
                </Button>
              </div>

              <Link
                to={`/products/${product.slug}`}
                onClick={close}
                className="link-underline mt-7 inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-forest-900 uppercase"
              >
                Full details <ArrowUpRight size={14} />
              </Link>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
