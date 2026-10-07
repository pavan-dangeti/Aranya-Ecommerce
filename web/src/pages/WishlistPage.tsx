import { m } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { ProductCard } from '@/components/products/ProductCard'
import { PageShell } from './PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { fadeUp } from '@/utils/motion'
import { useDocumentMeta } from '@/hooks'

export default function WishlistPage() {
  useDocumentMeta('Wishlist — ARANYA')
  const { data: user } = useAuth()
  const { data: saved = [], isPending } = useWishlist()

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-ivory-100 to-ivory-50 pt-36 pb-12">
        <div className="shell">
          <p className="eyebrow text-bronze-700">Saved for later</p>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight">Wishlist</h1>
        </div>
      </header>

      <div className="shell py-14 pb-28">
        {isPending && user ? (
          <p className="py-16 text-center text-sm text-forest-900/65">Loading your wishlist…</p>
        ) : !user ? (
          <m.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-md py-16 text-center"
          >
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-clay-500/[0.07] text-clay-500">
              <Heart size={30} strokeWidth={1.4} />
            </span>
            <h2 className="mt-8 font-display text-3xl font-medium">Sign in to save products</h2>
            <p className="mt-4 leading-relaxed text-forest-900/65">
              Your wishlist follows your account across devices.
            </p>
            <ButtonLink to="/login/customer" className="mt-8" variant="primary" magnetic>
              Sign in
            </ButtonLink>
          </m.div>
        ) : saved.length === 0 ? (
          <m.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-md py-16 text-center"
          >
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-clay-500/[0.07] text-clay-500">
              <Heart size={30} strokeWidth={1.4} />
            </span>
            <h2 className="mt-8 font-display text-3xl font-medium">Nothing saved yet</h2>
            <p className="mt-4 leading-relaxed text-forest-900/65">
              Tap the heart on any product to keep it here while you wander.
            </p>
            <ButtonLink to="/products" className="mt-8" variant="primary" magnetic>
              Wander the shop
            </ButtonLink>
          </m.div>
        ) : (
          <div className="grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
