import { Link, useNavigate } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { useCartView } from '@/hooks/useCartView'
import { orderApi } from '@/lib/api'
import { formatPrice } from '@/utils/format'
import { PageShell } from './PageShell'
import { Button, ButtonLink } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ProductVisual } from '@/components/products/ProductVisual'
import { fadeUp } from '@/utils/motion'
import { useDocumentMeta } from '@/hooks'

export default function CartPage() {
  useDocumentMeta('Your Basket — ARANYA')
  const navigate = useNavigate()
  const { lines, subtotal, setQty, remove, clear } = useCartView()
  const shipping = orderApi.shippingFor(subtotal)

  if (lines.length === 0) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell grid min-h-[70vh] place-items-center pt-24 pb-24 text-center">
          <m.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-md">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-forest-900/[0.05] text-moss-500">
              <ShoppingBag size={30} strokeWidth={1.4} />
            </span>
            <h1 className="mt-8 font-display text-4xl font-medium">Your basket is empty</h1>
            <p className="mt-4 leading-relaxed text-forest-900/65">
              Nothing gathered yet. The apothecary shelves are full — start with a bestseller or a
              tisane for the afternoon.
            </p>
            <ButtonLink to="/products" variant="primary" size="lg" magnetic className="mt-9">
              Explore Products
            </ButtonLink>
          </m.div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-ivory-100 to-ivory-50 pt-36 pb-12">
        <div className="shell flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-bronze-700">Your Selection</p>
            <h1 className="mt-2 font-display text-5xl font-medium tracking-tight">Basket</h1>
          </div>
          <button
            type="button"
            onClick={clear}
            className="link-underline cursor-pointer pb-1.5 text-xs font-bold tracking-[0.14em] text-clay-600 uppercase"
          >
            Empty basket
          </button>
        </div>
      </header>

      <div className="shell grid gap-12 py-14 lg:grid-cols-[1fr_380px] lg:gap-16">
        <ul className="divide-y divide-forest-900/[0.07] border-y hairline">
          {lines.map((line) => {
            return (
              <li key={line.productId} className="flex gap-5 py-7 sm:gap-7">
                <Link to={`/products/${line.slug}`} className="w-24 shrink-0 sm:w-28">
                  <div className="overflow-hidden rounded-2xl border hairline bg-white/40">
                    <ProductVisual {...line.visual} name={line.name} backdrop={false} />
                  </div>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/products/${line.slug}`}
                        className="font-display text-lg leading-snug font-medium transition-colors hover:text-bronze-600"
                      >
                        {line.name}
                      </Link>
                      <p className="mt-1 text-sm text-forest-900/65">
                        {formatPrice(line.price)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      aria-label={`Remove ${line.name}`}
                      className="cursor-pointer p-1.5 text-forest-900/65 transition-colors hover:text-clay-500"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QuantityStepper value={line.qty} onChange={(v) => setQty(line.productId, v)} />
                    <span className="font-display text-xl font-semibold tabular-nums">
                      {formatPrice(line.price * line.qty)}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <aside aria-label="Order summary">
          <div className="sticky top-28 rounded-3xl border hairline bg-ivory-100/70 p-8">
            <h2 className="font-display text-2xl font-medium">Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-forest-900/65">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-forest-900/65">
                <dt>Estimated shipping</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? 'Complimentary' : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t hairline pt-4 font-display text-2xl font-semibold text-forest-900">
                <dt>Total</dt>
                <dd data-testid="cart-total">{formatPrice(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Button
              variant="bronze"
              size="lg"
              magnetic
              className="mt-7 w-full"
              data-testid="cart-checkout"
              onClick={() => navigate('/checkout')}
            >
              Checkout <ArrowRight size={15} />
            </Button>
            <Link
              to="/products"
              className="link-underline mx-auto mt-5 block w-fit text-xs font-bold tracking-[0.14em] text-forest-900/65 uppercase"
            >
              Continue shopping
            </Link>
            <p className="mt-6 text-center text-[11px] leading-relaxed text-forest-900/65">
              Checkout is simulated · No payment is processed and no card details are ever
              requested.
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
