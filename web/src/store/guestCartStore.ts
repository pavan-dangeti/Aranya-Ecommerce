import type { CartItem } from '@aranya/shared'
import { MAX_QTY_PER_LINE } from '@aranya/shared/constants'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuestCartState {
  items: CartItem[]
  add: (productId: string, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const clamp = (qty: number) => Math.max(0, Math.min(qty, MAX_QTY_PER_LINE))

/**
 * The cart of a visitor who has not signed in. This is the only client-side
 * persisted state in the app; once the user signs in the server cart wins and
 * this is folded into it via POST /cart/merge.
 */
export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],

      add: (productId, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === productId)
          if (!existing) return { items: [...state.items, { productId, qty: clamp(qty) }] }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, qty: clamp(i.qty + qty) } : i,
            ),
          }
        }),

      setQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, qty: clamp(qty) } : i)),
        })),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      clear: () => set({ items: [] }),
    }),
    { name: 'aranya-guest-cart' },
  ),
)
