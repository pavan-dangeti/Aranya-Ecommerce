import { describe, expect, it } from 'vitest'
import { resolveApiUrl } from '../src/lib/api'

describe('resolveApiUrl', () => {
  // Regression guard: the production build compiles BASE to the relative
  // '/api', and `new URL('/api/products')` without a base throws
  // "Invalid URL". That broke every request in a production bundle.
  it('resolves a relative base against the page origin', () => {
    expect(resolveApiUrl('/products', 'https://shop.example', '/api').toString()).toBe(
      'https://shop.example/api/products',
    )
  })

  it('keeps an absolute base, as used in development', () => {
    expect(
      resolveApiUrl('/auth/login', 'http://localhost:5173', 'http://localhost:8787/api').toString(),
    ).toBe('http://localhost:8787/api/auth/login')
  })

  it('preserves a sub-path base', () => {
    expect(resolveApiUrl('/cart', 'https://shop.example', '/backend/api').toString()).toBe(
      'https://shop.example/backend/api/cart',
    )
  })

  it('strips a trailing slash from the base', () => {
    expect(resolveApiUrl('/cart', 'https://shop.example', '/api/').toString()).toBe(
      'https://shop.example/api/cart',
    )
  })
})
