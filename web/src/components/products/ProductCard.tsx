import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Eye, Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '@/types'
import { categoryName } from '@/data/categories'
import { formatPrice, discountPercent } from '@/utils/format'
import { useCartView } from '@/hooks/useCartView'
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist'
import { useUi } from '@/store/uiStore'
import { Rating } from '@/components/ui/Rating'
import { ProductVisual } from './ProductVisual'
import { fadeUp, viewportOnce } from '@/utils/motion'
import { cn } from '@/utils/cn'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { add } = useCartView()
  const openCart = useUi((s) => s.openCart)
  const setQuickView = useUi((s) => s.setQuickView)
  const wishlisted = useIsInWishlist(product.id)
  const { mutate: toggleWishlist } = useToggleWishlist()
  const discount = discountPercent(product.price, product.compareAtPrice)

  return (
    <m.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportOnce, margin: '-40px' }}
      transition={{ delay: (index % 3) * 0.07 }}
      data-testid={`product-card-${product.slug}`}
      className="group relative flex h-full flex-col"
    >
      <div className="relative overflow-hidden rounded-3xl border hairline bg-gradient-to-b from-ivory-100 to-ivory-200/60 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift">
        <Link
          to={`/products/${product.slug}`}
          className="block px-6 pt-6"
          aria-label={`View ${product.name}`}
        >
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.045]">
            <ProductVisual {...product.visual} name={product.name} />
          </div>
        </Link>

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isNew && (
            <span className="rounded-full bg-forest-900 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-ivory-50 uppercase">
              New
            </span>
          )}
          {discount && (
            <span className="rounded-full bg-clay-500 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-ivory-50 uppercase">
              Save {discount}%
            </span>
          )}
          {product.stock <= 20 && !product.isNew && !discount && (
            <span className="rounded-full border border-bronze-500/40 bg-ivory-50/80 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-bronze-700 uppercase backdrop-blur-sm">
              Few left
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={
            wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          className={cn(
            'absolute top-3.5 right-3.5 grid size-9 cursor-pointer place-items-center rounded-full backdrop-blur-md transition-all duration-300',
            wishlisted
              ? 'bg-clay-500 text-ivory-50 opacity-100'
              : 'bg-ivory-50/70 text-forest-900/65 opacity-0 group-hover:opacity-100 hover:text-clay-500 focus-visible:opacity-100',
          )}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>

        <div className="absolute inset-x-4 bottom-4 flex translate-y-3 gap-2 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => {
              add(product.id, 1)
              openCart()
            }}
            data-testid={`add-to-cart-${product.slug}`}
            className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-forest-900 text-xs font-bold tracking-[0.12em] text-ivory-50 uppercase transition-colors hover:bg-forest-700"
          >
            <ShoppingBag size={15} /> Add to Cart
          </button>
          <button
            type="button"
            onClick={() => setQuickView(product.slug)}
            aria-label={`Quick view ${product.name}`}
            className="grid size-11 cursor-pointer place-items-center rounded-full bg-ivory-50/85 text-forest-900 backdrop-blur-md transition-colors hover:bg-bronze-500 hover:text-forest-950"
          >
            <Eye size={17} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-5">
        <p className="eyebrow text-[10px] text-forest-900/65">{categoryName(product.category)}</p>
        <h3 className="mt-2 font-display text-lg leading-snug font-medium">
          <Link
            to={`/products/${product.slug}`}
            className="transition-colors hover:text-bronze-600"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5">
          <Rating value={product.rating} size={13} count={product.reviewCount} />
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-forest-900/65 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </m.article>
  )
}
