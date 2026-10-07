import type {
  Product,
  PagedProducts,
  AdminDashboard,
  AdminCustomerQueryInput,
  OrderStatus,
  PagedAdminReviews,
  PagedAuditLog,
  PagedCustomers,
  PagedOrders,
  AdminOrderQueryInput,
  AdminProductInput,
  AdminProductPatch,
  AdminProductQueryInput,
  AdminReviewQueryInput,
  CategoryId,
  ProductQueryInput,
  Review,
  CartView,
  CartItem,
  Order,
  OrderAddress,
  PaymentMethod,
  User,
  ErrorResponse,
} from '@aranya/shared'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, shippingFor } from '@aranya/shared/constants'

const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
const WAKE_UP_WINDOW_MS = 90_000
const WAKE_UP_RETRY_MS = 2_500
const SLEEPING_STATUSES = new Set([502, 503, 504])

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId: string,
    public readonly details?: Array<{ path: string; message: string }>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let wakingRequests = 0
const wakeListeners = new Set<() => void>()
const setWaking = (delta: number) => {
  wakingRequests += delta
  wakeListeners.forEach((listener) => listener())
}

/** True while any request is retrying against a sleeping free-tier API host. */
export const isServerWaking = () => wakingRequests > 0

export function subscribeServerWaking(listener: () => void): () => void {
  wakeListeners.add(listener)
  return () => wakeListeners.delete(listener)
}

async function withWakeUp(run: () => Promise<Response>): Promise<Response> {
  const deadline = Date.now() + WAKE_UP_WINDOW_MS
  let waiting = false
  const wait = async () => {
    if (!waiting) setWaking(1)
    waiting = true
    await new Promise((r) => setTimeout(r, WAKE_UP_RETRY_MS))
  }

  try {
    for (;;) {
      let res: Response
      try {
        res = await run()
      } catch (err) {
        if (Date.now() >= deadline) throw err
        await wait()
        continue
      }
      if (!SLEEPING_STATUSES.has(res.status) || Date.now() >= deadline) return res
      await wait()
    }
  } finally {
    if (waiting) setWaking(-1)
  }
}

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
let onUnauthenticated: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function onAuthLost(handler: () => void): void {
  onUnauthenticated = handler
}

function csrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)aranya_csrf=([^;]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

async function parseError(res: Response): Promise<ApiError> {
  let code = 'http_error'
  let message = `Request failed with ${res.status}`
  let requestId = ''
  let details: Array<{ path: string; message: string }> | undefined

  try {
    const body = (await res.json()) as ErrorResponse
    code = body.error.code
    message = body.error.message
    requestId = body.error.requestId
    details = body.error.details
  } catch {
    // non-JSON error body
  }

  if (message.trim() === '') message = `Request failed with ${res.status}`
  return new ApiError(res.status, code, message, requestId, details)
}

async function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing

  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken() ?? '' },
      })
      if (!res.ok) return false
      const body = (await res.json()) as { accessToken: string }
      accessToken = body.accessToken
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

/**
 * Builds a request URL. `base` is absolute when VITE_API_URL is set and
 * relative ('/api') in a same-origin deployment, so it is resolved against the
 * page origin — `new URL('/api/x')` on its own throws.
 */
export function resolveApiUrl(path: string, origin: string, base: string = BASE): URL {
  return new URL(`${base.replace(/\/$/, '')}${path}`, origin)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | string[] | undefined>
  auth?: boolean
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options

  const send = () => {
    const url = resolveApiUrl(path, window.location.origin)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue
        for (const v of Array.isArray(value) ? value : [value])
          url.searchParams.append(key, String(v))
      }
    }

    const outgoing = new Headers({ Accept: 'application/json' })
    if (body !== undefined) outgoing.set('Content-Type', 'application/json')
    if (auth && accessToken) outgoing.set('Authorization', `Bearer ${accessToken}`)
    if (method !== 'GET') {
      const token = csrfToken()
      if (token) outgoing.set('X-CSRF-Token', token)
    }

    return fetch(url, {
      method,
      headers: outgoing,
      credentials: 'include',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  }

  let res = await withWakeUp(send)

  if (res.status === 401 && auth && (await refreshSession())) {
    res = await withWakeUp(send)
  }

  if (!res.ok) {
    const error = await parseError(res)
    // Only a real authenticated request that could not be rescued means the
    // session is gone. A failed sign-in or the cold-start refresh probe must
    // not sign the user out.
    if (res.status === 401 && auth) onUnauthenticated?.()
    throw error
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function queryFrom(params: ProductQueryInput): RequestOptions['query'] {
  return {
    search: params.search,
    categories: params.categories,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minRating: params.minRating,
    sort: params.sort,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export const productApi = {
  query(params: ProductQueryInput): Promise<PagedProducts> {
    return apiRequest<PagedProducts>('/products', { query: queryFrom(params) })
  },
  bySlug(slug: string): Promise<Product> {
    return apiRequest<Product>(`/products/${encodeURIComponent(slug)}`)
  },
  featured(): Promise<Product[]> {
    return apiRequest<Product[]>('/products/featured')
  },
  related(slug: string, limit = 4): Promise<Product[]> {
    return apiRequest<Product[]>(`/products/${encodeURIComponent(slug)}/related`, {
      query: { limit },
    })
  },
}

export const reviewApi = {
  byProduct(productId: string): Promise<Review[]> {
    return apiRequest<Review[]>(`/products/${encodeURIComponent(productId)}/reviews`)
  },
  add(input: {
    productId: string
    rating: number
    title: string
    body: string
    location?: string
  }): Promise<Review> {
    return apiRequest<Review>('/reviews', { method: 'POST', body: input })
  },
}

export const catalogApi = {
  categories() {
    return apiRequest<Array<{ id: CategoryId; name: string; tagline: string }>>('/categories', {})
  },
  ingredients() {
    return apiRequest<
      Array<{
        id: string
        name: string
        sanskritName: string
        latinName: string
        origin: string
        traditionalCategory: string
        description: string
        foundIn: string[]
        palette: { deep: string; soft: string; accent: string }
      }>
    >('/ingredients')
  },
  articles() {
    return apiRequest<
      Array<{
        slug: string
        title: string
        excerpt: string
        readTime: string
        topic: string
        date: string
        pullQuote: string
        sections: Array<{ heading?: string; paragraphs: string[] }>
      }>
    >('/articles')
  },
  articleBySlug(slug: string) {
    return apiRequest<{
      slug: string
      title: string
      excerpt: string
      readTime: string
      topic: string
      date: string
      pullQuote: string
      sections: Array<{ heading?: string; paragraphs: string[] }>
    }>(`/articles/${encodeURIComponent(slug)}`)
  },
  testimonials() {
    return apiRequest<
      Array<{ id: string; name: string; city: string; rating: number; quote: string }>
    >('/testimonials')
  },
  faqs() {
    return apiRequest<Array<{ question: string; answer: string }>>('/faqs')
  },
}

export const cartApi = {
  view(): Promise<CartView> {
    return apiRequest<CartView>('/cart')
  },
  setQty(productId: string, qty: number): Promise<CartView> {
    return apiRequest<CartView>(`/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: { qty },
    })
  },
  clear(): Promise<CartView> {
    return apiRequest<CartView>('/cart', { method: 'DELETE' })
  },
  merge(items: CartItem[]): Promise<CartView> {
    return apiRequest<CartView>('/cart/merge', {
      method: 'POST',
      body: { items },
    })
  },
}

export const wishlistApi = {
  view(): Promise<Product[]> {
    return apiRequest<Product[]>('/wishlist')
  },
  toggle(productId: string): Promise<{ ids: string[] }> {
    return apiRequest<{ ids: string[] }>(`/wishlist/${encodeURIComponent(productId)}`, {
      method: 'POST',
    })
  },
}

export const addressApi = {
  list(): Promise<
    Array<{
      id: string
      label: string
      fullName: string
      phone: string
      addressLine: string
      city: string
      state: string
      postalCode: string
      isDefault: boolean
    }>
  > {
    return apiRequest<unknown[]>('/addresses') as Promise<
      Array<{
        id: string
        label: string
        fullName: string
        phone: string
        addressLine: string
        city: string
        state: string
        postalCode: string
        isDefault: boolean
      }>
    >
  },
  add(input: {
    label: string
    fullName: string
    phone: string
    addressLine: string
    city: string
    state: string
    postalCode: string
    isDefault?: boolean
  }): Promise<{
    id: string
    label: string
    fullName: string
    phone: string
    addressLine: string
    city: string
    state: string
    postalCode: string
    isDefault: boolean
  }> {
    return apiRequest('/addresses', { method: 'POST', body: input })
  },
  update(
    id: string,
    input: {
      label: string
      fullName: string
      phone: string
      addressLine: string
      city: string
      state: string
      postalCode: string
      isDefault?: boolean
    },
  ): Promise<{
    id: string
    label: string
    fullName: string
    phone: string
    addressLine: string
    city: string
    state: string
    postalCode: string
    isDefault: boolean
  }> {
    return apiRequest(`/addresses/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
  },
  remove(id: string): Promise<{ ok: true }> {
    return apiRequest<{ ok: true }>(`/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}

export const orderApi = {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  shippingFor,

  /**
   * The server checks out from its own cart, so a guest cart has to land there
   * first. Merge is a single call that clamps quantities to available stock.
   */
  async place(input: {
    items?: CartItem[]
    address: OrderAddress
    paymentMethod: PaymentMethod
    upiId?: string
  }): Promise<Order> {
    if (input.items?.length) await cartApi.merge(input.items)

    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: {
        address: input.address,
        paymentMethod: input.paymentMethod,
        ...(input.upiId ? { upiId: input.upiId } : {}),
        idempotencyKey: crypto.randomUUID(),
      },
    })
  },
  list(): Promise<Order[]> {
    return apiRequest<Order[]>('/orders')
  },
  byId(orderId: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${encodeURIComponent(orderId)}`)
  },
}

export const adminApi = {
  dashboard(): Promise<AdminDashboard> {
    return apiRequest<AdminDashboard>('/admin/dashboard')
  },

  products(query: AdminProductQueryInput): Promise<PagedProducts> {
    return apiRequest<PagedProducts>('/admin/products', { query: { ...query } })
  },
  createProduct(input: AdminProductInput): Promise<Product> {
    return apiRequest<Product>('/admin/products', { method: 'POST', body: input })
  },
  updateProduct(id: string, input: AdminProductPatch): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
    })
  },
  deleteProduct(id: string): Promise<{ ok: true }> {
    return apiRequest<{ ok: true }>(`/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
  adjustStock(id: string, stock: number, reason?: string): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${encodeURIComponent(id)}/stock`, {
      method: 'POST',
      body: { stock, ...(reason ? { reason } : {}) },
    })
  },
  lowStock(limit = 8): Promise<Product[]> {
    return apiRequest<Product[]>('/admin/inventory/low-stock', { query: { limit } })
  },

  orders(query: AdminOrderQueryInput): Promise<PagedOrders> {
    return apiRequest<PagedOrders>('/admin/orders', { query: { ...query } })
  },
  setOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return apiRequest<Order>(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'POST',
      body: { status },
    })
  },

  customers(query: AdminCustomerQueryInput): Promise<PagedCustomers> {
    return apiRequest<PagedCustomers>('/admin/customers', { query: { ...query } })
  },

  reviews(query: AdminReviewQueryInput): Promise<PagedAdminReviews> {
    return apiRequest<PagedAdminReviews>('/admin/reviews', { query: { ...query } })
  },
  setReviewStatus(reviewId: string, status: 'Pending' | 'Approved' | 'Rejected') {
    return apiRequest<{ id: string; productId: string; status: string }>(
      `/admin/reviews/${encodeURIComponent(reviewId)}/status`,
      { method: 'POST', body: { status } },
    )
  },

  audit(query: { entity?: string; entityId?: string; page?: number; pageSize?: number }) {
    return apiRequest<PagedAuditLog>('/admin/audit', { query: { ...query } })
  },
}

/** Fire-and-forget request at boot so a sleeping API host starts waking immediately. */
export function warmUpApi(): void {
  apiRequest('/health', { auth: false }).catch(() => undefined)
}

export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const body = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    accessToken = body.accessToken
    return body.user
  },
  async register(name: string, email: string, password: string, phone?: string): Promise<User> {
    const body = await apiRequest<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: { name, email, password, ...(phone ? { phone } : {}) },
      auth: false,
    })
    accessToken = body.accessToken
    return body.user
  },
  async restore(): Promise<User | null> {
    if (!/(?:^|;\s*)aranya_session=/.test(document.cookie)) return null
    try {
      const body = await apiRequest<{ user: User; accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: {},
        auth: false,
      })
      accessToken = body.accessToken
      return body.user
    } catch {
      accessToken = null
      document.cookie = 'aranya_session=; Max-Age=0; path=/'
      return null
    }
  },
  /** Validates the in-memory access token and returns the session user. */
  async me(): Promise<User> {
    return apiRequest<User>('/auth/me')
  },
  async logout(): Promise<void> {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST', body: {}, auth: false })
    } finally {
      accessToken = null
    }
  },
  async forgotPassword(email: string): Promise<void> {
    await apiRequest<void>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    })
  },
  async resetPassword(token: string, password: string): Promise<void> {
    await apiRequest<void>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      auth: false,
    })
  },
  async updateProfile(patch: Partial<Pick<User, 'name' | 'phone'>>): Promise<User> {
    return apiRequest<User>('/auth/profile', { method: 'PATCH', body: patch })
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest<void>('/auth/password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    })
  },
}

export type {
  AdminDashboard,
  User,
  CartView,
  CartItem,
  Product,
  Order,
  OrderAddress,
  PaymentMethod,
  PagedProducts,
  ProductQueryInput,
} from '@aranya/shared'
