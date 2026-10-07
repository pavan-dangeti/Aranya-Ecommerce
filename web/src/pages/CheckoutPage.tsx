import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { m } from 'framer-motion'
import { BadgeCheck, CreditCard, Landmark, Lock, Smartphone } from 'lucide-react'
import type { OrderAddress, PaymentMethod } from '@/types'
import { useCartView } from '@/hooks/useCartView'
import { formatPrice } from '@/utils/format'
import {
  minLength,
  required,
  validEmail,
  validPhoneIN,
  validPostalIN,
  validUpiId,
  type FieldError,
} from '@/utils/validate'
import { PageShell } from './PageShell'
import { Button } from '@/components/ui/Button'
import { ProductVisual } from '@/components/products/ProductVisual'
import { useDocumentMeta } from '@/hooks'
import { cn } from '@/utils/cn'
import { fadeUp } from '@/utils/motion'
import { useAuth } from '@/hooks/useAuth'
import { useAddresses, usePlaceOrder } from '@/hooks/useOrders'
import { shippingFor } from '@aranya/shared/constants'

type FormState = OrderAddress

const INITIAL: FormState = {
  fullName: '',
  email: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
}

export default function CheckoutPage() {
  useDocumentMeta('Checkout — ARANYA')
  const navigate = useNavigate()
  const { data: user, isPending: authPending } = useAuth()
  const { lines, subtotal, items, clear } = useCartView()
  const { data: addresses = [] } = useAddresses()
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0]
  const shipping = shippingFor(subtotal)
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  }))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'upi', string>>>({})
  const [payment, setPayment] = useState<PaymentMethod>('upi')
  const [upiId, setUpiId] = useState('')
  const placeOrder = usePlaceOrder()
  const placing = placeOrder.isPending
  const failed = placeOrder.error instanceof Error ? placeOrder.error.message : null

  const validators = useMemo(
    () => ({
      fullName: (v: string) => minLength(v, 2, 'Full name'),
      email: (v: string) => required(v, 'Email') ?? validEmail(v),
      phone: (v: string) => required(v, 'Phone') ?? validPhoneIN(v),
      addressLine: (v: string) => minLength(v, 8, 'Address'),
      city: (v: string) => minLength(v, 2, 'City'),
      state: (v: string) => minLength(v, 2, 'State'),
      postalCode: (v: string) => required(v, 'PIN code') ?? validPostalIN(v),
      country: (v: string) => required(v, 'Country'),
    }),
    [],
  )

  // Orders are tied to an account; the guest basket survives sign-in via the cart merge.
  if (!authPending && !user)
    return <Navigate to="/login/customer" state={{ from: '/checkout' }} replace />

  if (lines.length === 0 && !placing) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell grid min-h-[60vh] place-items-center pt-24 pb-24 text-center">
          <div>
            <h1 className="font-display text-4xl font-medium">Nothing to check out</h1>
            <p className="mt-3 text-forest-900/65">Your basket is empty — add a ritual first.</p>
            <Button className="mt-8" onClick={() => navigate('/products')}>
              Browse products
            </Button>
          </div>
        </div>
      </PageShell>
    )
  }

  const validateField = (field: keyof typeof validators): FieldError =>
    validators[field](form[field])

  const onBlur = (field: keyof typeof validators) => () =>
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: Partial<Record<keyof FormState | 'upi', string>> = {}
    for (const field of Object.keys(validators) as Array<keyof typeof validators>) {
      const err = validateField(field)
      if (err) nextErrors[field] = err
    }
    if (payment === 'upi') {
      const err = upiId.trim() ? validUpiId(upiId) : 'Enter your UPI ID'
      if (err) nextErrors.upi = err
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      const order = await placeOrder.mutateAsync({ items, address: form, paymentMethod: payment })
      clear()
      navigate(`/order/${order.id}`, { replace: true })
    } catch {
      // The mutation exposes the failure; `failed` renders it above the form.
    }
  }

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-ivory-100 to-ivory-50 pt-36 pb-12">
        <div className="shell">
          <p className="eyebrow text-bronze-700">Almost there</p>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight">Checkout</h1>
        </div>
      </header>

      <form
        onSubmit={submit}
        noValidate
        className="shell grid gap-12 py-14 lg:grid-cols-[1fr_400px] lg:gap-16"
      >
        <div className="space-y-10">
          <section aria-labelledby="contact-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="contact-heading" className="font-display text-2xl font-medium">
                1 · Contact & delivery
              </h2>
              {user && defaultAddress && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      fullName: defaultAddress.fullName,
                      phone: defaultAddress.phone,
                      addressLine: defaultAddress.addressLine,
                      city: defaultAddress.city,
                      state: defaultAddress.state,
                      postalCode: defaultAddress.postalCode,
                    }))
                  }
                  data-testid="use-saved-address"
                  className="cursor-pointer rounded-full border border-bronze-500/40 px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-bronze-700 uppercase transition-colors hover:bg-bronze-500/10"
                >
                  Use saved address · {defaultAddress.label}
                </button>
              )}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName} className="sm:col-span-2">
                <input
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  onBlur={onBlur('fullName')}
                  aria-invalid={Boolean(errors.fullName)}
                  className={inputClass(errors.fullName)}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={onBlur('email')}
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass(errors.email)}
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onBlur={onBlur('phone')}
                  aria-invalid={Boolean(errors.phone)}
                  className={inputClass(errors.phone)}
                />
              </Field>
              <Field label="Street address" error={errors.addressLine} className="sm:col-span-2">
                <textarea
                  rows={2}
                  autoComplete="street-address"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  onBlur={onBlur('addressLine')}
                  aria-invalid={Boolean(errors.addressLine)}
                  className={cn(inputClass(errors.addressLine), 'resize-none')}
                />
              </Field>
              <Field label="City" error={errors.city}>
                <input
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  onBlur={onBlur('city')}
                  aria-invalid={Boolean(errors.city)}
                  className={inputClass(errors.city)}
                />
              </Field>
              <Field label="State" error={errors.state}>
                <input
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  onBlur={onBlur('state')}
                  aria-invalid={Boolean(errors.state)}
                  className={inputClass(errors.state)}
                />
              </Field>
              <Field label="PIN code" error={errors.postalCode}>
                <input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value.replace(/[^\d]/g, '') })
                  }
                  onBlur={onBlur('postalCode')}
                  aria-invalid={Boolean(errors.postalCode)}
                  className={inputClass(errors.postalCode)}
                />
              </Field>
              <Field label="Country" error={errors.country}>
                <select
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  onBlur={onBlur('country')}
                  className={cn(inputClass(), 'cursor-pointer appearance-none')}
                >
                  {['India'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-display text-2xl font-medium">
              2 · Payment method
            </h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-forest-900/65">
              <Lock size={13} /> Simulated checkout — nothing is charged and no card details are
              collected.
            </p>

            <div role="radiogroup" aria-label="Payment method" className="mt-6 space-y-3">
              <PayOption
                selected={payment === 'upi'}
                onSelect={() => setPayment('upi')}
                icon={<Smartphone size={19} />}
                title="UPI"
                body="GPay, PhonePe, Paytm and other UPI apps"
              >
                <input
                  placeholder="yourname@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  aria-label="UPI ID"
                  aria-invalid={Boolean(errors.upi)}
                  className={cn(
                    inputClass(errors.upi),
                    'h-11 w-full max-w-xs rounded-xl px-4 text-sm',
                  )}
                />
                {errors.upi && (
                  <p role="alert" className="text-xs font-semibold text-clay-600">
                    {errors.upi}
                  </p>
                )}
              </PayOption>

              <PayOption
                selected={payment === 'card'}
                onSelect={() => setPayment('card')}
                icon={<CreditCard size={19} />}
                title="Card"
                body="Visa, Mastercard, RuPay"
              >
                <div className="rounded-xl border border-dashed border-bronze-500/40 bg-bronze-500/[0.06] p-4 text-xs leading-relaxed text-forest-900/65">
                  Card payments are simulated in this demo build. When a real gateway is connected,
                  its secure SDK collects card data directly — it never touches this application.
                </div>
              </PayOption>

              <PayOption
                selected={payment === 'cod'}
                onSelect={() => setPayment('cod')}
                icon={<Landmark size={19} />}
                title="Cash on Delivery"
                body="Pay the courier when your parcel arrives"
              />
            </div>
          </section>

          {failed && (
            <p
              role="alert"
              className="rounded-2xl border border-clay-500/30 bg-clay-500/[0.06] p-5 text-sm font-semibold text-clay-600"
            >
              {failed}
            </p>
          )}
        </div>

        <aside aria-label="Order summary">
          <m.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="sticky top-28 rounded-3xl border hairline bg-ivory-100/70 p-7"
          >
            <h2 className="font-display text-xl font-medium">Order summary</h2>
            <ul className="mt-5 space-y-4">
              {lines.map((line) => {
                return (
                  <li key={line.productId} className="flex items-center gap-3.5">
                    <span className="w-12 shrink-0 overflow-hidden rounded-lg border hairline bg-white/40">
                      <ProductVisual {...line.visual} name={line.name} backdrop={false} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{line.name}</span>
                      <span className="text-xs text-forest-900/65">Qty {line.qty}</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {formatPrice(line.price * line.qty)}
                    </span>
                  </li>
                )
              })}
            </ul>
            <dl className="mt-6 space-y-2.5 border-t hairline pt-5 text-sm">
              <div className="flex justify-between text-forest-900/65">
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-forest-900/65">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between pt-1 font-display text-xl font-semibold">
                <dt>Total</dt>
                <dd data-testid="checkout-total">{formatPrice(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Button
              type="submit"
              variant="bronze"
              size="lg"
              magnetic
              className="mt-6 w-full"
              disabled={placing}
              data-testid="place-order"
            >
              {placing ? 'Placing order…' : `Place Order · ${formatPrice(subtotal + shipping)}`}
            </Button>
            <Link
              to="/cart"
              className="link-underline mx-auto mt-4 block w-fit text-xs font-bold tracking-wide text-forest-900/65 uppercase"
            >
              Back to basket
            </Link>
          </m.div>
        </aside>
      </form>
    </PageShell>
  )
}

function inputClass(error?: string) {
  return cn(
    'h-13 w-full rounded-xl border bg-ivory-50 px-4 text-sm outline-none transition-colors focus:border-bronze-500',
    error ? 'border-clay-500' : 'hairline',
  )
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: FieldError
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-forest-900/65 uppercase">
        {label}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-semibold text-clay-600">
          {error}
        </span>
      )}
    </label>
  )
}

function PayOption({
  selected,
  onSelect,
  icon,
  title,
  body,
  children,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        selected
          ? 'border-bronze-500 bg-bronze-500/[0.05] shadow-[0_0_0_1px_var(--color-bronze-500)]'
          : 'hairline hover:border-bronze-500/40',
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="flex w-full cursor-pointer items-center gap-4 p-5 text-left"
      >
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full transition-colors',
            selected ? 'bg-bronze-500 text-forest-950' : 'bg-forest-900/[0.05] text-moss-600',
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">{title}</span>
          <span className="block text-xs text-forest-900/65">{body}</span>
        </span>
        <BadgeCheck
          size={20}
          className={cn(
            'shrink-0 transition-opacity',
            selected ? 'text-bronze-700 opacity-100' : 'opacity-0',
          )}
        />
      </button>
      {children && <div className="px-5 pb-5">{selected && children}</div>}
    </div>
  )
}
