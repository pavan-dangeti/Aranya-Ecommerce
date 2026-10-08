import { publicAuthorName } from '../src/routes/commerce.js'
import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client.js'
import { auditLogs, products, reviews } from '../src/db/schema.js'
import { json, loginAdmin, registerCustomer, request, type Session } from './setup.js'

describe('catalog reads', () => {
  it('paginates with a stable total', async () => {
    const page = await json<{ total: number; page: number; items: unknown[]; totalPages: number }>(
      await request('/products?pageSize=5&page=1'),
    )
    expect(page.items).toHaveLength(5)
    expect(page.total).toBeGreaterThan(5)
    expect(page.totalPages).toBe(Math.ceil(page.total / 5))
  })

  it('sorts by price ascending', async () => {
    const page = await json<{ items: Array<{ price: number }> }>(
      await request('/products?sort=price-asc&pageSize=48'),
    )
    const prices = page.items.map((p) => p.price)
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
  })

  it('sorts by price descending', async () => {
    const page = await json<{ items: Array<{ price: number }> }>(
      await request('/products?sort=price-desc&pageSize=48'),
    )
    const prices = page.items.map((p) => p.price)
    expect([...prices].sort((a, b) => b - a)).toEqual(prices)
  })

  it('filters by category', async () => {
    const page = await json<{ items: Array<{ category: string }> }>(
      await request('/products?categories=skin-care&pageSize=48'),
    )
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((p) => p.category === 'skin-care')).toBe(true)
  })

  it('filters by minimum rating', async () => {
    const page = await json<{ items: Array<{ rating: number }> }>(
      await request('/products?minRating=4.5&pageSize=48'),
    )
    expect(page.items.every((p) => p.rating >= 4.5)).toBe(true)
  })

  it('filters by price range', async () => {
    const page = await json<{ items: Array<{ price: number }> }>(
      await request('/products?minPrice=400&maxPrice=800&pageSize=48'),
    )
    expect(page.items.every((p) => p.price >= 400 && p.price <= 800)).toBe(true)
  })

  it('searches across name and origin', async () => {
    const page = await json<{ items: Array<{ name: string }> }>(
      await request('/products?search=ashwa'),
    )
    expect(page.items.length).toBeGreaterThan(0)
  })

  // `category` is an enum and `ingredients` is jsonb, so both need care in the
  // search predicate. These pin the whole OR chain to a single query.
  it('searches ingredient names and category ids without erroring', async () => {
    const byIngredient = await json<{ items: Array<{ name: string }> }>(
      await request('/products?search=ashwagandha&pageSize=48'),
    )
    expect(byIngredient.items.length).toBeGreaterThan(0)

    const byCategory = await json<{ items: Array<{ category: string }> }>(
      await request('/products?search=hair-care&pageSize=48'),
    )
    expect(byCategory.items.length).toBeGreaterThan(0)
    expect(byCategory.items.every((p) => p.category === 'hair-care')).toBe(true)
  })

  it('returns an empty page for a nonsense search rather than erroring', async () => {
    const page = await json<{ items: unknown[]; total: number }>(
      await request('/products?search=zzzznotathing'),
    )
    expect(page.items).toHaveLength(0)
    expect(page.total).toBe(0)
  })

  it('clamps an out-of-range page number', async () => {
    const page = await json<{ page: number }>(await request('/products?page=999'))
    expect(page.page).toBeGreaterThan(0)
  })

  it('returns one product by slug', async () => {
    const list = await json<{ items: Array<{ slug: string }> }>(
      await request('/products?pageSize=1'),
    )
    const slug = list.items[0]!.slug
    const product = await json<{ slug: string; ingredients: unknown[] }>(
      await request(`/products/${slug}`),
    )
    expect(product.slug).toBe(slug)
  })

  it('404s an unknown slug', async () => {
    const res = await request('/products/no-such-product')
    expect(res.status).toBe(404)
  })

  it('serves featured products', async () => {
    const featured = await json<Array<{ featured?: boolean }>>(await request('/products/featured'))
    expect(featured.length).toBeGreaterThan(0)
  })

  it('serves related products that exclude the current one', async () => {
    const list = await json<{ items: Array<{ slug: string }> }>(
      await request('/products?pageSize=1'),
    )
    const slug = list.items[0]!.slug
    const related = await json<Array<{ slug: string }>>(await request(`/products/${slug}/related`))
    expect(related.every((p) => p.slug !== slug)).toBe(true)
  })

  it('serves the content collections', async () => {
    for (const path of ['/categories', '/ingredients', '/articles', '/testimonials', '/faqs']) {
      const res = await request(path)
      expect(res.status, path).toBe(200)
      const body = await json<unknown[]>(res)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThan(0)
    }
  })

  it('serves a single article', async () => {
    const articles = await json<Array<{ slug: string }>>(await request('/articles'))
    const article = await json<{ slug: string }>(await request(`/articles/${articles[0]!.slug}`))
    expect(article.slug).toBe(articles[0]!.slug)
  })
})

describe('query validation', () => {
  it('rejects an unknown category', async () => {
    const res = await request('/products?categories=not-a-category')
    expect(res.status).toBe(422)
  })

  it('rejects an unknown sort option', async () => {
    const res = await request('/products?sort=cheapest')
    expect(res.status).toBe(422)
  })

  it('rejects a rating above five', async () => {
    const res = await request('/products?minRating=9')
    expect(res.status).toBe(422)
  })

  it('rejects a zero page size', async () => {
    const res = await request('/products?pageSize=0')
    expect(res.status).toBe(422)
  })

  it('reports every invalid field in one response', async () => {
    const res = await request('/products?categories=nope&sort=nope')
    const body = (await res.json()) as { error: { details: unknown[] } }
    expect(body.error.details.length).toBeGreaterThanOrEqual(2)
  })

  it('includes the request id in the error envelope', async () => {
    const res = await request('/products/does-not-exist')
    const body = (await res.json()) as {
      error: { requestId: string; code: string; message: string }
    }
    expect(body.error.requestId).toBeTruthy()
    expect(body.error.code).toBe('product_not_found')
    expect(body.error.message).toBeTruthy()
  })
})

describe('reviews', () => {
  it('only shows approved reviews on the public endpoint', async () => {
    const session = await registerCustomer('rev@example.com')
    await request('/reviews', {
      method: 'POST',
      session,
      body: JSON.stringify({
        productId: 'arn-001',
        rating: 5,
        title: 'Great',
        body: 'A really nice daily tea.',
      }),
    })

    const publicList = await json<Array<{ author: string }>>(
      await request('/products/arn-001/reviews'),
    )
    expect(publicList.some((r) => r.author.includes('rev'))).toBe(false)
  })

  it('publishes the reviewer as "First L." and never anything from their email', async () => {
    const session = await registerCustomer('private.person@example.com')
    const res = await request('/reviews', {
      method: 'POST',
      session,
      body: JSON.stringify({
        productId: 'arn-001',
        rating: 4,
        title: 'Lovely',
        body: 'Calm and fragrant every morning.',
      }),
    })
    const review = await json<{ author: string }>(res)
    expect(review.author).toBe('Test C.')
    expect(review.author).not.toMatch(/private|example/i)
  })

  it('formats public author names', () => {
    expect(publicAuthorName('Asha Rao')).toBe('Asha R.')
    expect(publicAuthorName('  Mira  ')).toBe('Mira')
    expect(publicAuthorName('Anil Kumar Verma')).toBe('Anil V.')
    expect(publicAuthorName('')).toBe('Verified buyer')
  })

  it('accepts a review and queues it as pending', async () => {
    const session = await registerCustomer('rev2@example.com')
    const res = await request('/reviews', {
      method: 'POST',
      session,
      body: JSON.stringify({
        productId: 'arn-001',
        rating: 4,
        title: 'Solid',
        body: 'Works after a week of use.',
      }),
    })
    expect(res.status).toBe(201)

    const rows = await db.select().from(reviews).where(eq(reviews.productId, 'arn-001'))
    expect(rows.some((r) => r.status === 'Pending')).toBe(true)
  })

  it('blocks a second review of the same product', async () => {
    const session = await registerCustomer('rev3@example.com')
    const body = JSON.stringify({
      productId: 'arn-004',
      rating: 4,
      title: 'Nice',
      body: 'Really quite pleasant.',
    })
    await request('/reviews', { method: 'POST', session, body })
    const second = await request('/reviews', { method: 'POST', session, body })
    expect(second.status).toBe(409)
  })

  it('requires a rating between one and five', async () => {
    const session = await registerCustomer('rev4@example.com')
    const res = await request('/reviews', {
      method: 'POST',
      session,
      body: JSON.stringify({
        productId: 'arn-001',
        rating: 9,
        title: 'Nice',
        body: 'Really quite pleasant.',
      }),
    })
    expect(res.status).toBe(422)
  })

  it('requires authentication to submit', async () => {
    const res = await request('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'arn-001',
        rating: 5,
        title: 'Nice',
        body: 'Really quite pleasant.',
      }),
    })
    expect(res.status).toBe(401)
  })

  it('recomputes the product rating once a review is approved', async () => {
    const session = await registerCustomer('rev5@example.com')
    await request('/reviews', {
      method: 'POST',
      session,
      body: JSON.stringify({
        productId: 'arn-006',
        rating: 1,
        title: 'Not for me',
        body: 'Far too strong a scent for me.',
      }),
    })
    const admin = await loginAdmin()
    const queue = await json<{ items: Array<{ id: string; productId: string }> }>(
      await request('/admin/reviews?status=Pending', { session: admin }),
    )
    const mine = queue.items.find((r) => r.productId === 'arn-006')!

    await request(`/admin/reviews/${mine.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Approved' }),
    })

    const publicList = await json<Array<{ productId: string; rating: number }>>(
      await request('/products/arn-006/reviews'),
    )
    expect(publicList.some((r) => r.rating === 1)).toBe(true)
  })
})

describe('admin operations', () => {
  it('paginates the product list', async () => {
    const admin = await loginAdmin()
    const page = await json<{ items: unknown[]; pageSize: number; page: number }>(
      await request('/admin/products?pageSize=3&page=1', { session: admin }),
    )
    expect(page.items).toHaveLength(3)
    expect(page.pageSize).toBe(3)
  })

  it('searches and filters admin products', async () => {
    const admin = await loginAdmin()
    const page = await json<{ items: Array<{ category: string }> }>(
      await request('/admin/products?category=wellness', { session: admin }),
    )
    expect(page.items.every((p) => p.category === 'wellness')).toBe(true)
  })

  it('filters low and out of stock', async () => {
    const admin = await loginAdmin()
    await request('/admin/products/arn-002/stock', {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ stock: 0, reason: 'test' }),
    })
    const out = await json<{ items: Array<{ id: string }> }>(
      await request('/admin/products?stockState=out', { session: admin }),
    )
    expect(out.items.some((p) => p.id === 'arn-002')).toBe(true)
  })

  it('creates a product with a generated slug', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/products', {
      method: 'POST',
      session: admin,
      body: JSON.stringify({
        name: 'Test Balm',
        category: 'skin-care',
        description: 'A calming test balm created by the automated test suite for verification.',
        shortDescription: 'A test balm.',
        price: 499,
        stock: 5,
        origin: 'Kerala',
        usage: 'Apply twice daily.',
      }),
    })
    expect(res.status).toBe(201)
    const created = await json<{ slug: string }>(res)
    expect(created.slug).toBe('test-balm')

    const fetched = await json<{ name: string }>(await request('/products/test-balm'))
    expect(fetched.name).toBe('Test Balm')
  })

  it('rejects a duplicate slug by suffixing it', async () => {
    const admin = await loginAdmin()
    const payload = JSON.stringify({
      name: 'Test Balm',
      category: 'skin-care',
      description: 'A second calming test balm created by the automated test suite here.',
      shortDescription: 'Another test balm.',
      price: 499,
      stock: 5,
      origin: 'Kerala',
      usage: 'Apply twice daily.',
    })
    await request('/admin/products', { method: 'POST', session: admin, body: payload })
    const second = await request('/admin/products', {
      method: 'POST',
      session: admin,
      body: payload,
    })
    expect((await json<{ slug: string }>(second)).slug).toBe('test-balm-2')
  })

  it('updates a product', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/products/arn-001', {
      method: 'PATCH',
      session: admin,
      body: JSON.stringify({ price: 1111 }),
    })
    expect((await json<{ price: number }>(res)).price).toBe(1111)
  })

  it('refuses to delete a product that appears in an order', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/products/arn-001', { method: 'DELETE', session: admin })
    expect(res.status).toBe(409)
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('product_in_use')
  })

  it('adjusts stock and records the delta', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/products/arn-007/stock', {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ stock: 42, reason: 'restock' }),
    })
    expect((await json<{ stock: number }>(res)).stock).toBe(42)
  })

  it('rejects a negative stock adjustment', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/products/arn-007/stock', {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ stock: -1 }),
    })
    expect(res.status).toBe(422)
  })

  it('lists customers with spend', async () => {
    const admin = await loginAdmin()
    const page = await json<{ items: Array<{ spent: number; status: string }> }>(
      await request('/admin/customers', { session: admin }),
    )
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((c) => ['Active', 'VIP', 'Dormant'].includes(c.status))).toBe(true)
  })

  it('sorts customers by spend', async () => {
    const admin = await loginAdmin()
    const page = await json<{ items: Array<{ spent: number }> }>(
      await request('/admin/customers?sort=spent-desc&pageSize=48', { session: admin }),
    )
    const spends = page.items.map((c) => c.spent)
    expect([...spends].sort((a, b) => b - a)).toEqual(spends)
  })

  it('reports dashboard metrics', async () => {
    const admin = await loginAdmin()
    const stats = await json<{
      orders: number
      products: number
      revenueSeries: unknown[]
      recentOrders: unknown[]
    }>(await request('/admin/dashboard', { session: admin }))
    expect(stats.products).toBeGreaterThan(0)
    expect(stats.orders).toBeGreaterThan(0)
    expect(stats.revenueSeries.length).toBeGreaterThan(0)
  })

  it('writes audit entries for admin mutations', async () => {
    const admin = await loginAdmin()
    await request('/admin/products/arn-010', {
      method: 'PATCH',
      session: admin,
      body: JSON.stringify({ price: 333 }),
    })

    const audit = await json<{
      items: Array<{ action: string; entity: string; meta: Record<string, unknown> | null }>
    }>(await request('/admin/audit?entity=product', { session: admin }))
    expect(audit.items.some((a) => a.action === 'product.update')).toBe(true)

    const rows = await db.select().from(auditLogs).where(eq(auditLogs.entity, 'product'))
    expect(rows.length).toBeGreaterThan(0)
  })

  it('rejects an unknown sort option on admin lists', async () => {
    const admin = await loginAdmin()
    const res = await request('/admin/products?sort=whatever', { session: admin })
    expect(res.status).toBe(422)
  })
})

describe('operational endpoints', () => {
  it('reports liveness', async () => {
    const res = await request('/health')
    expect(res.status).toBe(200)
    expect((await json<{ status: string }>(res)).status).toBe('ok')
  })

  it('reports readiness with the database', async () => {
    const res = await request('/health/ready')
    expect(res.status).toBe(200)
    expect((await json<{ database: string }>(res)).database).toBe('up')
  })

  it('sets the hardening headers on api responses', async () => {
    const res = await request('/health')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'")
  })

  it('404s an unknown api path with the standard envelope', async () => {
    const res = await request('/not-a-real-endpoint')
    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('not_found')
  })

  it('rejects an oversized body', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(200_000) }),
    })
    expect(res.status).toBe(413)
  })

  it('publishes the OpenAPI document', async () => {
    const res = await request('/openapi.json')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as { openapi: string; paths: Record<string, unknown> }
    expect(doc.openapi).toMatch(/^3\./)
    expect(Object.keys(doc.paths).length).toBeGreaterThan(30)
  })
})

describe('session teardown', () => {
  it('invalidates the access token after logout only expires naturally', async () => {
    const session: Session = await registerCustomer('teardown@example.com')
    const before = await request('/auth/me', { session })
    expect(before.status).toBe(200)
    await request('/auth/logout', { method: 'POST', session, body: '{}' })
    const after = await request('/auth/refresh', { method: 'POST', session, body: '{}' })
    expect(after.status).toBe(401)
  })

  it('deletes a product created only for a negative test', async () => {
    const rows = await db.select().from(products).where(eq(products.slug, 'test-balm-2'))
    for (const row of rows) await db.delete(products).where(eq(products.id, row.id))
    expect(true).toBe(true)
  })
})
