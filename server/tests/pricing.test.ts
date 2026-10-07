import { describe, expect, it } from 'vitest'
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  ORDER_TRANSITIONS,
  canTransition,
  shippingFor,
  slugify,
  MAX_QTY_PER_LINE,
} from '@aranya/shared'
import { priceCart } from '../src/services/order.service.js'

describe('pricing', () => {
  it('charges nothing for an empty cart', () => {
    expect(shippingFor(0)).toBe(0)
  })

  it('charges the flat shipping fee below the free threshold', () => {
    expect(shippingFor(1)).toBe(SHIPPING_FEE)
    expect(shippingFor(998)).toBe(SHIPPING_FEE)
  })

  it('ships free exactly at the threshold', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD)).toBe(0)
  })

  it('ships free above the threshold', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD + 1)).toBe(0)
    expect(shippingFor(999_999)).toBe(0)
  })

  it('sums line totals into a subtotal', () => {
    expect(priceCart([{ price: 450, qty: 2 }]).subtotal).toBe(900)
  })

  it('adds shipping below the threshold to reach the total', () => {
    expect(priceCart([{ price: 100, qty: 1 }])).toEqual({
      subtotal: 100,
      shipping: SHIPPING_FEE,
      total: 100 + SHIPPING_FEE,
    })
  })

  it('does not add shipping at or above the threshold', () => {
    expect(priceCart([{ price: 1000, qty: 1 }])).toEqual({
      subtotal: 1000,
      shipping: 0,
      total: 1000,
    })
  })

  it('is zero for no lines', () => {
    expect(priceCart([])).toEqual({ subtotal: 0, shipping: 0, total: 0 })
  })

  it('multiplies price by quantity per line', () => {
    expect(priceCart([{ price: 333, qty: 3 }]).subtotal).toBe(999)
  })
})

describe('order status state machine', () => {
  it('allows the happy path forward', () => {
    expect(canTransition('Pending', 'Processing')).toBe(true)
    expect(canTransition('Processing', 'Shipped')).toBe(true)
    expect(canTransition('Shipped', 'Delivered')).toBe(true)
  })

  it('allows cancelling before dispatch only', () => {
    expect(canTransition('Pending', 'Cancelled')).toBe(true)
    expect(canTransition('Processing', 'Cancelled')).toBe(true)
    expect(canTransition('Shipped', 'Cancelled')).toBe(false)
    expect(canTransition('Delivered', 'Cancelled')).toBe(false)
  })

  it('never leaves a terminal state', () => {
    expect(ORDER_TRANSITIONS.Delivered).toHaveLength(0)
    expect(ORDER_TRANSITIONS.Cancelled).toHaveLength(0)
  })

  it('rejects skipping states', () => {
    expect(canTransition('Pending', 'Shipped')).toBe(false)
    expect(canTransition('Pending', 'Delivered')).toBe(false)
    expect(canTransition('Processing', 'Delivered')).toBe(false)
  })

  it('rejects going backwards', () => {
    expect(canTransition('Shipped', 'Processing')).toBe(false)
    expect(canTransition('Delivered', 'Shipped')).toBe(false)
  })

  it('rejects every self-transition', () => {
    for (const status of Object.keys(ORDER_TRANSITIONS) as Array<keyof typeof ORDER_TRANSITIONS>) {
      expect(canTransition(status, status)).toBe(false)
    }
  })
})

describe('slugify', () => {
  it('lowercases and dashes a name', () => {
    expect(slugify('Ashwagandha Balance')).toBe('ashwagandha-balance')
  })

  it('drops punctuation', () => {
    expect(slugify('Turmeric & Ginger (Gold)')).toBe('turmeric-ginger-gold')
  })

  it('collapses repeated separators', () => {
    expect(slugify('Ashw    Kshetra   Gold')).toBe('ashw-kshetra-gold')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  Lotus  ')).toBe('lotus')
  })
})

describe('cart quantity cap', () => {
  it('is ten units per line', () => {
    expect(MAX_QTY_PER_LINE).toBe(10)
  })
})
