import { Link, useParams } from 'react-router'
import { m } from 'framer-motion'
import { Check, PackageOpen } from 'lucide-react'
import { useOrder } from '@/hooks/useOrders'
import { formatEta, formatPrice } from '@/utils/format'
import { PageShell } from './PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { EASE_ORGANIC } from '@/utils/motion'
import { useDocumentMeta } from '@/hooks'

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isPending } = useOrder(orderId ?? '')
  useDocumentMeta('Order Confirmed — ARANYA')

  if (isPending) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell grid min-h-[60vh] place-items-center pt-24">
          <p className="eyebrow animate-pulse text-forest-900/65" role="status">
            Fetching your order…
          </p>
        </div>
      </PageShell>
    )
  }

  if (!order) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell grid min-h-[60vh] place-items-center pt-24 pb-24 text-center">
          <div>
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-forest-900/[0.05] text-moss-500">
              <PackageOpen size={26} strokeWidth={1.5} />
            </span>
            <h1 className="mt-7 font-display text-4xl font-medium">We couldn't find that order</h1>
            <p className="mt-3 max-w-sm text-forest-900/65">
              This order is saved to your account. Check the reference in your confirmation email.
            </p>
            <ButtonLink to="/products" className="mt-8">
              Back to the shop
            </ButtonLink>
          </div>
        </div>
      </PageShell>
    )
  }

  const paymentLabel =
    order.paymentMethod === 'upi'
      ? 'UPI (simulated)'
      : order.paymentMethod === 'card'
        ? 'Card (simulated)'
        : 'Cash on Delivery'

  return (
    <PageShell className="bg-ivory-50">
      <div className="shell grid min-h-[80vh] place-items-center py-36">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_ORGANIC }}
          className="w-full max-w-2xl"
          data-testid="order-confirmation"
        >
          <div className="text-center">
            <m.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="mx-auto grid size-20 place-items-center rounded-full bg-moss-600 text-ivory-50 shadow-lift"
            >
              <Check size={34} strokeWidth={2.4} />
            </m.span>
            <h1 className="mt-8 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              The forest thanks you
            </h1>
            <p className="mt-4 leading-relaxed text-forest-900/65">
              Your order is confirmed and being prepared with care by our small team. A confirmation
              note would normally travel to{' '}
              <strong className="font-semibold">{order.address.email}</strong>.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border hairline bg-ivory-100/70">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline bg-forest-900 px-7 py-5 text-ivory-50">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">
                  Order number
                </p>
                <p
                  className="mt-0.5 font-mono text-lg font-semibold tracking-wider"
                  data-testid="order-id"
                >
                  {order.id}
                </p>
              </div>
              <span className="rounded-full border border-bronze-400/40 bg-bronze-500/10 px-4 py-1.5 text-xs font-bold text-bronze-300">
                {order.status}
              </span>
            </div>

            <ul className="divide-y divide-forest-900/[0.06] px-7">
              {order.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-4 py-4 text-sm"
                >
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="ml-2 text-forest-900/65">× {item.qty}</span>
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t hairline px-7 py-5 text-sm">
              <div className="flex justify-between text-forest-900/65">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-forest-900/65">
                <dt>Shipping</dt>
                <dd>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd>
              </div>
              <div className="flex justify-between font-display text-xl font-semibold">
                <dt>Total paid</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="grid gap-6 border-t hairline px-7 py-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold tracking-[0.18em] text-forest-900/65 uppercase">
                  Delivering to
                </dt>
                <dd className="mt-1.5 leading-relaxed text-forest-900/75">
                  {order.address.fullName}
                  <br />
                  {order.address.addressLine}, {order.address.city}
                  <br />
                  {order.address.state} {order.address.postalCode}, {order.address.country}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-[0.18em] text-forest-900/65 uppercase">
                  Estimates
                </dt>
                <dd className="mt-1.5 leading-relaxed text-forest-900/75">
                  Arrival by{' '}
                  <strong className="font-semibold">
                    {formatDateSafe(order.estimatedDelivery)}
                  </strong>
                  <br />
                  Payment: {paymentLabel}
                </dd>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink to="/products" variant="primary" magnetic>
              Continue Exploring
            </ButtonLink>
            <Link
              to="/profile"
              className="link-underline text-xs font-bold tracking-[0.14em] text-forest-900/65 uppercase"
            >
              View your orders
            </Link>
          </div>
        </m.div>
      </div>
    </PageShell>
  )
}

function formatDateSafe(iso: string): string {
  try {
    return formatEta(0, new Date(iso))
  } catch {
    return iso
  }
}
