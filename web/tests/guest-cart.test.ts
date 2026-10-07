import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_QTY_PER_LINE } from '@aranya/shared'

const storage = new Map<string, string>()
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  },
})

const { useGuestCart } = await import('../src/store/guestCartStore')
const cart = () => useGuestCart.getState()

beforeEach(() => cart().clear())

describe('guest cart store', () => {
  it('adds a new line with quantity 1 by default', () => {
    cart().add('p1')
    expect(cart().items).toEqual([{ productId: 'p1', qty: 1 }])
  })

  it('increments an existing line instead of duplicating it', () => {
    cart().add('p1', 2)
    cart().add('p1', 3)
    expect(cart().items).toEqual([{ productId: 'p1', qty: 5 }])
  })

  it('clamps quantities to the per-line maximum', () => {
    cart().add('p1', MAX_QTY_PER_LINE + 5)
    expect(cart().items[0]!.qty).toBe(MAX_QTY_PER_LINE)
    cart().setQty('p1', 999)
    expect(cart().items[0]!.qty).toBe(MAX_QTY_PER_LINE)
  })

  it('removes a line when its quantity is set to zero', () => {
    cart().add('p1')
    cart().add('p2')
    cart().setQty('p1', 0)
    expect(cart().items.map((i) => i.productId)).toEqual(['p2'])
  })

  it('removes and clears lines', () => {
    cart().add('p1')
    cart().add('p2')
    cart().remove('p2')
    expect(cart().items).toHaveLength(1)
    cart().clear()
    expect(cart().items).toEqual([])
  })

  it('persists to localStorage under its own key, and nothing else', () => {
    cart().add('p9', 2)
    expect([...storage.keys()]).toEqual(['aranya-guest-cart'])
    expect(JSON.parse(storage.get('aranya-guest-cart')!).state.items).toEqual([
      { productId: 'p9', qty: 2 },
    ])
  })
})
