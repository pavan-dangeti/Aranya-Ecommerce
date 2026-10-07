import { Link, useNavigate } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import { Leaf, ShoppingBag, Trash2, X } from 'lucide-react'
import { useUi } from '@/store/uiStore'
import { useCartView } from '@/hooks/useCartView'
import { orderApi } from '@/lib/api'
import type { Product } from '@aranya/shared'
import { formatPrice } from '@/utils/format'
import { useLockBodyScroll } from '@/hooks'
import { useDialog } from '@/hooks/useDialog'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ProductVisual } from '@/components/products/ProductVisual'
import { EASE_ORGANIC } from '@/utils/motion'

export function CartDrawer() {
  const cartOpen = useUi((s) => s.cartOpen)
  const closeCart = useUi((s) => s.closeCart)
  const { lines, subtotal, setQty, remove } = useCartView()
  const navigate = useNavigate()
  const shipping = orderApi.shippingFor(subtotal)
  const freeAt = orderApi.FREE_SHIPPING_THRESHOLD

  useLockBodyScroll(cartOpen)

  const dialogRef = useDialog(cartOpen, closeCart)

  const progress = Math.min(1, subtotal / freeAt)

  return (
    <AnimatePresence>
      {cartOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-60"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <m.button
            type="button"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeCart}
            className="absolute inset-0 cursor-pointer bg-forest-950/45 backdrop-blur-[3px]"
          />
          <m.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.5, ease: EASE_ORGANIC }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory-50 shadow-lift-lg"
          >
            <div className="flex items-center justify-between border-b hairline px-6 py-5">
              <h2 className="font-display text-xl font-medium">
                Your Basket
                <span className="ml-2 text-sm text-forest-900/65">{lines.length}</span>
              </h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="grid size-9 cursor-pointer place-items-center rounded-full transition-colors hover:bg-forest-900/[0.06]"
              >
                <X size={18} />
              </button>
            </div>

            {lines.length === 0 ? (
              <EmptyBasket onClose={closeCart} />
            ) : (
              <>
                <div className="border-b hairline px-6 py-4">
                  {shipping === 0 ? (
                    <p className="flex items-center gap-2 text-xs font-semibold text-moss-500">
                      <Leaf size={14} /> Complimentary shipping unlocked
                    </p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-forest-900/70">
                        {formatPrice(freeAt - subtotal)} away from complimentary shipping
                      </p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-forest-900/[0.08]">
                        <m.div
                          className="h-full rounded-full bg-bronze-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress * 100}%` }}
                          transition={{ duration: 0.6, ease: EASE_ORGANIC }}
                        />
                      </div>
                    </>
                  )}
                </div>

                <ul className="flex-1 divide-y divide-forest-900/[0.06] overflow-y-auto px-6">
                  {lines.map((line) => (
                    <li key={line.productId} className="flex gap-4 py-5">
                      <Link
                        to={`/products/${line.slug}`}
                        onClick={closeCart}
                        className="w-20 shrink-0 overflow-hidden rounded-xl border border-forest-900/[0.07] bg-white/40"
                      >
                        <LineVisual visual={line.visual} name={line.name} />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={`/products/${line.slug}`}
                            onClick={closeCart}
                            className="font-display text-[15px] leading-snug font-medium transition-colors hover:text-bronze-600"
                          >
                            {line.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => remove(line.productId)}
                            aria-label={`Remove ${line.name} from basket`}
                            className="cursor-pointer p-1 text-forest-900/65 transition-colors hover:text-clay-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-forest-900/65">
                          {formatPrice(line.price)} each
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <QuantityStepper
                            value={line.qty}
                            onChange={(v) => setQty(line.productId, v)}
                            label={`Quantity of ${line.name}`}
                          />
                          <span className="text-sm font-bold tabular-nums">
                            {formatPrice(line.price * line.qty)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-4 border-t hairline px-6 py-5">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-forest-900/65">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-forest-900/65">
                      <dt>Estimated shipping</dt>
                      <dd className="tabular-nums">
                        {shipping === 0 ? 'Free' : formatPrice(shipping)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t hairline pt-2.5 font-display text-lg font-medium text-forest-900">
                      <dt>Total</dt>
                      <dd className="tabular-nums" data-testid="cart-drawer-total">
                        {formatPrice(subtotal + shipping)}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    variant="primary"
                    magnetic
                    className="w-full"
                    onClick={() => {
                      closeCart()
                      navigate('/checkout')
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="link-underline mx-auto block cursor-pointer text-xs font-semibold tracking-wide text-forest-900/65 uppercase"
                  >
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

function LineVisual({ visual, name }: { visual: Product['visual']; name: string }) {
  return <ProductVisual {...visual} name={name} backdrop={false} />
}

function EmptyBasket({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-forest-900/[0.05] text-moss-500">
        <ShoppingBag size={24} strokeWidth={1.5} />
      </span>
      <div>
        <h3 className="font-display text-xl font-medium">Your basket is empty</h3>
        <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-forest-900/65">
          The forest is patient. Begin with a ritual that suits your day.
        </p>
      </div>
      <Button
        onClick={() => {
          onClose()
          navigate('/products')
        }}
      >
        Explore Products
      </Button>
    </div>
  )
}
