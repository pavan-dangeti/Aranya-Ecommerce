import type { CartItem, CartView, Product } from '@aranya/shared'
import { MAX_QTY_PER_LINE } from '@aranya/shared/constants'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/lib/api'
import { useProducts } from './useProducts'
import { useGuestCart } from '@/store/guestCartStore'
import { useAuth } from './useAuth'
import { useToasts } from '@/store/toastStore'

interface CartLine {
  productId: string
  slug: string
  name: string
  price: number
  qty: number
  stock: number
  /** Bottle artwork. The server sends it on cart lines; guests get it from the catalogue. */
  visual: Product['visual']
}

const CART_KEY = ['cart'] as const

/**
 * One cart for the whole app. Signed in, the server owns pricing and stock and
 * every write goes through the API; signed out we keep a local cart that is
 * merged into the server cart on sign-in.
 */
export function useCartView() {
  const { data: user, isPending: authPending } = useAuth()
  const signedIn = Boolean(user)
  const queryClient = useQueryClient()
  const guest = useGuestCart()
  const push = useToasts((s) => s.push)

  const { data, isPending } = useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.view,
    enabled: signedIn,
  })

  // A guest basket only stores product ids, so names and prices come from the
  // catalogue. Fetched only while signed out; the server still recomputes every
  // amount at checkout.
  const { data: catalogue } = useProducts(
    { sort: 'featured', page: 1, pageSize: 48 },
    !signedIn && guest.items.length > 0,
  )

  const setQtyRemote = useMutation({
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) =>
      cartApi.setQty(productId, qty),
    onMutate: async ({ productId, qty }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY })
      const previous = queryClient.getQueryData<CartView>(CART_KEY)
      queryClient.setQueryData<CartView>(CART_KEY, (old) => {
        if (!old) return old
        return {
          ...old,
          items:
            qty <= 0
              ? old.items.filter((i) => i.productId !== productId)
              : old.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        }
      })
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(CART_KEY, ctx.previous)
      push(err.message, 'error')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  })

  const clearRemote = useMutation({
    mutationFn: cartApi.clear,
    onError: (err) => push(err.message, 'error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  })

  const serverLines: CartLine[] = data?.items ?? []

  const byId = new Map((catalogue?.items ?? []).map((p) => [p.id, p]))

  const lines: CartLine[] = signedIn
    ? serverLines
    : guest.items.flatMap((item) => {
        const product = byId.get(item.productId)
        if (!product) return []
        return [
          {
            productId: item.productId,
            slug: product.slug,
            name: product.name,
            price: product.price,
            qty: item.qty,
            stock: product.stock,
            visual: product.visual,
          },
        ]
      })

  const subtotal = signedIn
    ? (data?.subtotal ?? 0)
    : lines.reduce((sum, line) => sum + line.price * line.qty, 0)

  const count = lines.reduce((sum, line) => sum + line.qty, 0)

  const write = (productId: string, qty: number) => {
    if (signedIn) setQtyRemote.mutate({ productId, qty })
    else guest.setQty(productId, qty)
  }

  return {
    lines,
    subtotal,
    count,
    /** False while the session or the server cart is still loading. */
    ready:
      !authPending &&
      (!signedIn || (!isPending && data !== undefined)) &&
      (signedIn || catalogue !== undefined),
    items: lines.map(({ productId, qty }) => ({ productId, qty })) satisfies CartItem[],

    add(productId: string, qty = 1) {
      if (signedIn) {
        // The API sets an absolute quantity, so add has to send the new total.
        const current = serverLines.find((l) => l.productId === productId)
        setQtyRemote.mutate({
          productId,
          qty: Math.min((current?.qty ?? 0) + qty, MAX_QTY_PER_LINE),
        })
      } else {
        guest.add(productId, qty)
      }
    },
    setQty: write,
    remove: (productId: string) => write(productId, 0),
    clear() {
      if (signedIn) clearRemote.mutate()
      else guest.clear()
    },
  }
}
