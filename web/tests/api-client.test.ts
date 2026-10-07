import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (url: URL, init: RequestInit) => Response | Promise<Response>

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const envelope = (status: number, code: string, message: string, details?: unknown) =>
  json(status, { error: { code, message, requestId: 'req-1', details } })

let calls: Array<{ url: URL; init: RequestInit }>
let handler: Handler

async function loadClient() {
  vi.resetModules()
  return import('../src/lib/api')
}

beforeEach(() => {
  calls = []
  vi.stubGlobal('window', { location: { origin: 'https://shop.test' } })
  vi.stubGlobal('document', { cookie: 'aranya_csrf=csrf-abc' })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string, init: RequestInit = {}) => {
      const url = new URL(String(input), 'https://shop.test')
      calls.push({ url, init })
      return handler(url, init)
    }),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const header = (init: RequestInit, name: string) => new Headers(init.headers).get(name)

describe('API client', () => {
  it('surfaces the server error envelope as an ApiError', async () => {
    const { productApi, ApiError } = await loadClient()
    handler = () => envelope(404, 'not_found', 'Product not found')
    const err = await productApi.bySlug('missing').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      status: 404,
      code: 'not_found',
      message: 'Product not found',
      requestId: 'req-1',
    })
  })

  it('never produces an empty error message', async () => {
    const { productApi } = await loadClient()
    handler = () => envelope(400, 'bad_request', '   ')
    await expect(productApi.featured()).rejects.toThrow('Request failed with 400')
  })

  it('handles a non-JSON error body', async () => {
    const { productApi } = await loadClient()
    handler = () => new Response('<html>oops</html>', { status: 500 })
    await expect(productApi.featured()).rejects.toMatchObject({ status: 500, code: 'http_error' })
  })

  it('carries validation details for inline form errors', async () => {
    const { authApi } = await loadClient()
    handler = () =>
      envelope(422, 'validation_error', 'Invalid input', [
        { path: 'email', message: 'Invalid email' },
      ])
    await expect(authApi.register('A', 'nope', 'short')).rejects.toMatchObject({
      details: [{ path: 'email', message: 'Invalid email' }],
    })
  })

  it('sends the CSRF header on mutations but not on reads', async () => {
    const { cartApi } = await loadClient()
    handler = () => json(200, { items: [] })
    await cartApi.view()
    await cartApi.setQty('p1', 2)
    expect(header(calls[0]!.init, 'X-CSRF-Token')).toBeNull()
    expect(header(calls[1]!.init, 'X-CSRF-Token')).toBe('csrf-abc')
    expect(calls[1]!.init.credentials).toBe('include')
  })

  it('attaches the in-memory access token as a bearer header', async () => {
    const { cartApi, setAccessToken } = await loadClient()
    setAccessToken('tok-1')
    handler = () => json(200, { items: [] })
    await cartApi.view()
    expect(header(calls[0]!.init, 'Authorization')).toBe('Bearer tok-1')
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    const { orderApi, setAccessToken } = await loadClient()
    setAccessToken('expired')
    handler = (url, init) => {
      if (url.pathname === '/api/auth/refresh') return json(200, { accessToken: 'fresh' })
      return header(init, 'Authorization') === 'Bearer fresh'
        ? json(200, [])
        : envelope(401, 'unauthorized', 'Expired')
    }
    await expect(orderApi.list()).resolves.toEqual([])
    expect(calls.map((c) => c.url.pathname)).toEqual([
      '/api/orders',
      '/api/auth/refresh',
      '/api/orders',
    ])
  })

  it('shares one refresh between concurrent 401s', async () => {
    const { orderApi, cartApi, setAccessToken } = await loadClient()
    setAccessToken('expired')
    handler = (url, init) => {
      if (url.pathname === '/api/auth/refresh') return json(200, { accessToken: 'fresh' })
      return header(init, 'Authorization') === 'Bearer fresh'
        ? json(200, [])
        : envelope(401, 'unauthorized', 'Expired')
    }
    await Promise.all([orderApi.list(), cartApi.view()])
    expect(calls.filter((c) => c.url.pathname === '/api/auth/refresh')).toHaveLength(1)
  })

  it('signals a lost session when refresh fails', async () => {
    const { orderApi, onAuthLost, setAccessToken } = await loadClient()
    const lost = vi.fn()
    onAuthLost(lost)
    setAccessToken('expired')
    handler = () => envelope(401, 'unauthorized', 'Session expired')
    await expect(orderApi.list()).rejects.toMatchObject({ status: 401 })
    expect(lost).toHaveBeenCalledOnce()
  })

  it('does not sign the user out when a login attempt is rejected', async () => {
    const { authApi, onAuthLost } = await loadClient()
    const lost = vi.fn()
    onAuthLost(lost)
    handler = () => envelope(401, 'invalid_credentials', 'Email or password is incorrect')
    await expect(authApi.login('a@b.co', 'wrong-password')).rejects.toThrow(
      'Email or password is incorrect',
    )
    expect(lost).not.toHaveBeenCalled()
    expect(calls.some((c) => c.url.pathname === '/api/auth/refresh')).toBe(false)
  })

  it('surfaces a 403 without attempting a refresh', async () => {
    const { adminApi, setAccessToken } = await loadClient()
    setAccessToken('customer-token')
    handler = () => envelope(403, 'forbidden', 'Admin access required')
    await expect(adminApi.dashboard()).rejects.toMatchObject({ status: 403, code: 'forbidden' })
    expect(calls).toHaveLength(1)
  })

  it('retries a sleeping server and reports that it is waking up', async () => {
    vi.useFakeTimers()
    const { productApi, isServerWaking, subscribeServerWaking } = await loadClient()
    let n = 0
    handler = () => (++n < 3 ? new Response('', { status: 503 }) : json(200, []))
    const seen: boolean[] = []
    subscribeServerWaking(() => seen.push(isServerWaking()))
    const pending = productApi.featured()
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(pending).resolves.toEqual([])
    expect(n).toBe(3)
    expect(seen).toEqual([true, false])
    expect(isServerWaking()).toBe(false)
  })

  it('gives up on a sleeping server after the wake-up window', async () => {
    vi.useFakeTimers()
    const { productApi } = await loadClient()
    handler = () => new Response('', { status: 502 })
    const pending = productApi.featured().catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(95_000)
    expect(await pending).toMatchObject({ status: 502, message: 'Request failed with 502' })
  })

  it('retries network failures during cold start', async () => {
    vi.useFakeTimers()
    const { productApi } = await loadClient()
    let n = 0
    handler = () => {
      if (++n === 1) throw new TypeError('Failed to fetch')
      return json(200, [])
    }
    const pending = productApi.featured()
    await vi.advanceTimersByTimeAsync(3_000)
    await expect(pending).resolves.toEqual([])
  })

  it('returns undefined for 204 responses', async () => {
    const { authApi } = await loadClient()
    handler = () => new Response(null, { status: 204 })
    await expect(authApi.forgotPassword('a@b.co')).resolves.toBeUndefined()
  })

  it('clears the access token on logout even if the request fails', async () => {
    const { authApi, setAccessToken, getAccessToken } = await loadClient()
    setAccessToken('tok')
    handler = () => envelope(500, 'internal', 'boom')
    await expect(authApi.logout()).rejects.toThrow()
    expect(getAccessToken()).toBeNull()
  })

  it('restore() skips the refresh probe for a visitor who never signed in', async () => {
    const { authApi } = await loadClient()
    await expect(authApi.restore()).resolves.toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('restore() resolves to null and drops the hint when the session is gone', async () => {
    const doc = { cookie: 'aranya_session=1' }
    vi.stubGlobal('document', doc)
    const { authApi, getAccessToken } = await loadClient()
    handler = () => envelope(401, 'unauthorized', 'No session')
    await expect(authApi.restore()).resolves.toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(doc.cookie).toContain('Max-Age=0')
  })

  it('restore() rebuilds the session from the refresh cookie', async () => {
    vi.stubGlobal('document', { cookie: 'aranya_session=1' })
    const { authApi, getAccessToken } = await loadClient()
    handler = () => json(200, { accessToken: 'restored', user: { id: 'u1', role: 'customer' } })
    await expect(authApi.restore()).resolves.toMatchObject({ id: 'u1' })
    expect(getAccessToken()).toBe('restored')
  })

  it('serialises array and scalar query params and skips undefined', async () => {
    const { productApi } = await loadClient()
    handler = () => json(200, { items: [], total: 0 })
    await productApi.query({
      categories: ['skin', 'hair'],
      search: 'tulsi',
      page: 2,
      minPrice: undefined,
    } as never)
    const params = calls[0]!.url.searchParams
    expect(params.getAll('categories')).toEqual(['skin', 'hair'])
    expect(params.get('search')).toBe('tulsi')
    expect(params.get('page')).toBe('2')
    expect(params.has('minPrice')).toBe(false)
  })

  it('places an order with a fresh idempotency key and merges the guest cart first', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'key-123' })
    const { orderApi } = await loadClient()
    handler = (url) => json(200, url.pathname.endsWith('/merge') ? { items: [] } : { id: 'o1' })
    await orderApi.place({
      items: [{ productId: 'p1', qty: 1 }],
      address: {} as never,
      paymentMethod: 'cod',
    })
    expect(calls.map((c) => c.url.pathname)).toEqual(['/api/cart/merge', '/api/orders'])
    expect(JSON.parse(String(calls[1]!.init.body))).toMatchObject({
      idempotencyKey: 'key-123',
      paymentMethod: 'cod',
    })
  })
})
