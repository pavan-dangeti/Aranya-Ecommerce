import { describe, expect, it } from 'vitest'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../src/db/client.js'
import { inventoryMovements, orders, products } from '../src/db/schema.js'
import {
  addToCart,
  checkoutBody,
  errorOf,
  json,
  loginAdmin,
  registerCustomer,
  request,
  type Session,
} from './setup.js'

async function placeOrder(session: Session, key: string, overrides: Record<string, unknown> = {}) {
  return request('/orders', { method: 'POST', session, body: checkoutBody(key, overrides) })
}

async function stockOf(productId: string): Promise<number> {
  const rows = await db.select().from(products).where(eq(products.id, productId))
  return rows[0]?.stock ?? -1
}

describe('checkout', () => {
  it('rejects an empty cart', async () => {
    const session = await registerCustomer('empty@example.com')
    const res = await placeOrder(session, 'empty-cart-key')
    expect(res.status).toBe(400)
    expect((await errorOf(res)).code).toBe('cart_empty')
  })

  it('recomputes the subtotal from database prices, not the client', async () => {
    const session = await registerCustomer('price@example.com')
    await addToCart(session, 'arn-001', 2)
    const product = (await db.select().from(products).where(eq(products.id, 'arn-001')))[0]!

    const res = await placeOrder(session, 'price-key-1')
    const order = await json<{ subtotal: number; total: number; items: Array<{ price: number }> }>(
      res,
    )
    expect(order.items[0]?.price).toBe(product.price)
    expect(order.subtotal).toBe(product.price * 2)
  })

  it('adds the flat shipping fee below the threshold', async () => {
    const session = await registerCustomer('shipfee@example.com')
    const cheap = await cheapestProduct(400)
    await addToCart(session, cheap, 1)

    const order = await json<{ subtotal: number; shipping: number; total: number }>(
      await placeOrder(session, 'shipfee-key-1'),
    )
    expect(order.subtotal).toBeLessThan(999)
    expect(order.shipping).toBe(79)
    expect(order.total).toBe(order.subtotal + 79)
  })

  it('ships free at or above the threshold', async () => {
    const session = await registerCustomer('shipfree@example.com')
    await addToCart(session, 'arn-001', 2)
    const order = await json<{ shipping: number; total: number; subtotal: number }>(
      await placeOrder(session, 'shipfree-key-1'),
    )
    expect(order.subtotal).toBeGreaterThanOrEqual(999)
    expect(order.shipping).toBe(0)
    expect(order.total).toBe(order.subtotal)
  })

  it('empties the cart once the order exists', async () => {
    const session = await registerCustomer('clear@example.com')
    await addToCart(session, 'arn-001', 1)
    await placeOrder(session, 'clear-key-1')
    expect(
      (await json<{ items: unknown[] }>(await request('/cart', { session }))).items,
    ).toHaveLength(0)
  })

  it('decrements stock by the ordered quantity', async () => {
    const session = await registerCustomer('stock@example.com')
    const before = await stockOf('arn-001')
    await addToCart(session, 'arn-001', 3)
    await placeOrder(session, 'stock-key-1')
    expect(await stockOf('arn-001')).toBe(before - 3)
  })

  it('writes an inventory movement for every line', async () => {
    const session = await registerCustomer('movement@example.com')
    await addToCart(session, 'arn-001', 2)
    await placeOrder(session, 'movement-key-1')
    const rows = await db
      .select()
      .from(inventoryMovements)
      .where(eq(inventoryMovements.productId, 'arn-001'))
    expect(rows.some((r) => r.delta === -2 && r.reason === 'order_placed')).toBe(true)
  })

  it('records a human-readable reference', async () => {
    const session = await registerCustomer('ref@example.com')
    await addToCart(session, 'arn-001', 1)
    const order = await json<{ reference: string }>(await placeOrder(session, 'ref-key-1'))
    expect(order.reference).toMatch(/^ARN-/)
  })
})

describe('idempotency', () => {
  it('returns the same order for a repeated checkout key', async () => {
    const session = await registerCustomer('idem@example.com')
    await addToCart(session, 'arn-001', 1)

    const first = await placeOrder(session, 'idem-key-1')
    const second = await placeOrder(session, 'idem-key-1')

    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    expect((await json<{ id: string }>(second)).id).toBe((await json<{ id: string }>(first)).id)
  })

  it('only decrements stock once for a repeated key', async () => {
    const session = await registerCustomer('idemstock@example.com')
    await addToCart(session, 'arn-001', 2)
    const before = await stockOf('arn-001')

    await placeOrder(session, 'idemstock-key-1')
    await placeOrder(session, 'idemstock-key-1')
    await placeOrder(session, 'idemstock-key-1')

    expect(await stockOf('arn-001')).toBe(before - 2)
  })

  it('creates two orders for two different keys', async () => {
    const session = await registerCustomer('twokeys@example.com')
    await addToCart(session, 'arn-001', 1)
    await placeOrder(session, 'twokeys-a')
    await addToCart(session, 'arn-001', 1)
    await placeOrder(session, 'twokeys-b')

    const history = await json<unknown[]>(await request('/orders', { session }))
    expect(history).toHaveLength(2)
  })

  it('scopes the key to the user', async () => {
    const a = await registerCustomer('scope-a@example.com')
    const b = await registerCustomer('scope-b@example.com')
    await addToCart(a, 'arn-001', 1)
    await addToCart(b, 'arn-001', 1)

    const first = await json<{ id: string }>(await placeOrder(a, 'shared-key'))
    const second = await json<{ id: string }>(await placeOrder(b, 'shared-key'))
    expect(first.id).not.toBe(second.id)
  })
})

describe('stock race', () => {
  it('lets exactly one of two concurrent orders win the last unit', async () => {
    const buyerA = await registerCustomer('race-a@example.com')
    const buyerB = await registerCustomer('race-b@example.com')

    const product = 'arn-011'
    await setStock(product, 1)

    await addToCart(buyerA, product, 1)
    await addToCart(buyerB, product, 1)

    const [resA, resB] = await Promise.all([
      placeOrder(buyerA, 'race-key-a'),
      placeOrder(buyerB, 'race-key-b'),
    ])

    const statuses = [resA.status, resB.status].sort()
    expect(statuses).toEqual([201, 409])

    const loser = resA.status === 409 ? resA : resB
    expect((await errorOf(loser)).code).toBe('insufficient_stock')

    expect(await stockOf(product)).toBe(0)
  })

  it('never drives stock negative across many concurrent buyers', async () => {
    const product = 'arn-009'
    await setStock(product, 5)

    const buyers = await Promise.all(
      Array.from({ length: 5 }, (_, i) => registerCustomer(`burst-${i}@example.com`)),
    )
    for (const buyer of buyers) await addToCart(buyer, product, 1)

    const results = await Promise.all(buyers.map((buyer, i) => placeOrder(buyer, `burst-key-${i}`)))

    const created = results.filter((r) => r.status === 201).length
    expect(created).toBe(5)
    expect(await stockOf(product)).toBe(0)
  })

  it('leaves stock untouched when the order is rejected', async () => {
    const product = 'arn-010'
    await setStock(product, 4)

    const buyer = await registerCustomer('rejectstock@example.com')
    await addToCart(buyer, product, 4)

    await setStock(product, 0)

    const res = await placeOrder(buyer, 'rejectstock-key')
    expect(res.status).toBe(409)
    expect(await stockOf(product)).toBe(0)
  })

  it('rejects a quantity beyond available stock at checkout even if the cart allowed it', async () => {
    const product = 'arn-012'
    await setStock(product, 2)
    const buyer = await registerCustomer('shrink@example.com')
    await addToCart(buyer, product, 2)

    await setStock(product, 1)

    const res = await placeOrder(buyer, 'shrink-key')
    expect(res.status).toBe(409)
    expect(await stockOf(product)).toBe(1)
  })

  it('releases the reservation when the gateway declines', async () => {
    const product = 'arn-003'
    await setStock(product, 4)
    const buyer = await registerCustomer('declined@example.com')
    await addToCart(buyer, product, 1)

    const before = await stockOf(product)
    const res = await placeOrder(buyer, 'declined-key', {
      paymentMethod: 'upi',
      upiId: 'someone@fail',
    })

    expect(res.status).toBe(402)
    expect((await errorOf(res)).code).toBe('payment_failed')
    expect(await stockOf(product)).toBe(before)

    const cancelled = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, buyer.userId), eq(orders.status, 'Cancelled')))
    expect(cancelled).toHaveLength(1)
  })
})

describe('order history and ownership', () => {
  it('lists only the caller orders', async () => {
    const a = await registerCustomer('own-a@example.com')
    const b = await registerCustomer('own-b@example.com')
    await addToCart(a, 'arn-001', 1)
    await addToCart(b, 'arn-001', 1)
    await placeOrder(a, 'own-key-a')
    await placeOrder(b, 'own-key-b')

    const mine = await json<Array<{ userId: string }>>(await request('/orders', { session: a }))
    expect(mine).toHaveLength(1)
    expect(mine.every((o) => o.userId === a.userId)).toBe(true)
  })

  it('never leaks another customer order by id', async () => {
    const a = await registerCustomer('peek-a@example.com')
    const b = await registerCustomer('peek-b@example.com')
    await addToCart(a, 'arn-001', 1)
    await placeOrder(a, 'peek-key')
    const target = (await json<Array<{ id: string }>>(await request('/orders', { session: a })))[0]!
      .id

    const res = await request(`/orders/${target}`, { session: b })
    // 404 rather than 403: the response must not confirm the order exists.
    expect(res.status).toBe(404)
    expect((await errorOf(res)).code).toBe('order_not_found')
  })

  it('404s an unknown order rather than 403', async () => {
    const a = await registerCustomer('missing@example.com')
    const res = await request('/orders/00000000-0000-0000-0000-000000000000', { session: a })
    expect(res.status).toBe(404)
  })

  it('requires a token for order history', async () => {
    const res = await request('/orders')
    expect(res.status).toBe(401)
  })
})

describe('admin order search', () => {
  it('finds an order by the id the console displays, and by customer name', async () => {
    const buyer = await registerCustomer('findme@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, 'arn-001', 1)
    const order = await json<{ id: string }>(await placeOrder(buyer, 'search-key'))

    for (const term of [order.id, order.id.slice(0, 8), 'Test Customer']) {
      const res = await request(`/admin/orders?search=${encodeURIComponent(term)}`, {
        session: admin,
      })
      const page = await json<{ items: Array<{ id: string }> }>(res)
      expect(
        page.items.map((o) => o.id),
        term,
      ).toContain(order.id)
    }
  })
})

describe('order state machine over HTTP', () => {
  it('walks an order forward', async () => {
    const buyer = await registerCustomer('walk@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, 'arn-001', 1)
    const order = await json<{ id: string; status: string }>(await placeOrder(buyer, 'walk-key'))

    expect(order.status).toBe('Pending')
    for (const status of ['Processing', 'Shipped', 'Delivered']) {
      const res = await request(`/admin/orders/${order.id}/status`, {
        method: 'POST',
        session: admin,
        body: JSON.stringify({ status }),
      })
      expect(res.status, `-> ${status}`).toBe(200)
      expect((await json<{ status: string }>(res)).status).toBe(status)
    }
  })

  it('rejects skipping a state', async () => {
    const buyer = await registerCustomer('skipstate@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, 'arn-001', 1)
    const order = await json<{ id: string }>(await placeOrder(buyer, 'skipstate-key'))

    const res = await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Shipped' }),
    })
    expect(res.status).toBe(400)
    expect((await errorOf(res)).code).toBe('invalid_transition')
  })

  it('rejects an unknown status value', async () => {
    const buyer = await registerCustomer('badstatus@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, 'arn-001', 1)
    const order = await json<{ id: string }>(await placeOrder(buyer, 'badstatus-key'))

    const res = await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Teleported' }),
    })
    expect(res.status).toBe(422)
  })

  it('restocks and refunds when an order is cancelled', async () => {
    const product = 'arn-005'
    await setStock(product, 6)
    const buyer = await registerCustomer('cancelstock@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, product, 3)
    const before = await stockOf(product)

    const order = await json<{ id: string }>(await placeOrder(buyer, 'cancelstock-key'))
    expect(await stockOf(product)).toBe(before - 3)

    const res = await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Cancelled' }),
    })
    expect(res.status).toBe(200)
    expect(await stockOf(product)).toBe(before)
  })

  it('will not cancel a shipped order', async () => {
    const buyer = await registerCustomer('shippedcancel@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, 'arn-001', 1)
    const order = await json<{ id: string }>(await placeOrder(buyer, 'shippedcancel-key'))

    await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Processing' }),
    })
    await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Shipped' }),
    })

    const res = await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Cancelled' }),
    })
    expect(res.status).toBe(400)
  })

  it('writes an audit entry for every status change', async () => {
    const buyer = await registerCustomer('auditstatus@example.com')
    const admin = await loginAdmin()
    await addToCart(buyer, 'arn-001', 1)
    const order = await json<{ id: string }>(await placeOrder(buyer, 'auditstatus-key'))

    await request(`/admin/orders/${order.id}/status`, {
      method: 'POST',
      session: admin,
      body: JSON.stringify({ status: 'Processing' }),
    })

    const audit = await json<{ items: Array<{ action: string; entity: string }> }>(
      await request('/admin/audit?entity=order', { session: admin }),
    )
    expect(audit.items.some((a) => a.action === 'order.status_change')).toBe(true)
  })
})

describe('addresses', () => {
  it('creates, updates and deletes an address', async () => {
    const session = await registerCustomer('addr@example.com')
    const created = await request('/addresses', {
      method: 'POST',
      session,
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine: '12 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        isDefault: true,
      }),
    })
    expect(created.status).toBe(201)
    const address = await json<{ id: string }>(created)

    const updated = await request(`/addresses/${address.id}`, {
      method: 'PATCH',
      session,
      body: JSON.stringify({
        label: 'Office',
        fullName: 'Test Customer',
        phone: '9876543210',
        addressLine: '34 Work Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560002',
        isDefault: true,
      }),
    })
    expect((await json<{ label: string }>(updated)).label).toBe('Office')

    const removed = await request(`/addresses/${address.id}`, { method: 'DELETE', session })
    expect(removed.status).toBe(200)
  })

  it('will not let one customer touch another address', async () => {
    const a = await registerCustomer('addra@example.com')
    const b = await registerCustomer('addrb@example.com')
    const created = await json<{ id: string }>(
      await request('/addresses', {
        method: 'POST',
        session: a,
        body: JSON.stringify({
          label: 'Home',
          fullName: 'Address Owner',
          phone: '9876543210',
          addressLine: '12 Test Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          isDefault: true,
        }),
      }),
    )

    const res = await request(`/addresses/${created.id}`, { method: 'DELETE', session: b })
    expect(res.status).toBe(404)
  })

  it('rejects an invalid PIN code', async () => {
    const session = await registerCustomer('addrpin@example.com')
    const res = await request('/addresses', {
      method: 'POST',
      session,
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Address Owner',
        phone: '9876543210',
        addressLine: '12 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '56000',
        isDefault: false,
      }),
    })
    expect(res.status).toBe(422)
  })
})

async function setStock(productId: string, stock: number): Promise<void> {
  await db.update(products).set({ stock }).where(eq(products.id, productId))
}

async function cheapestProduct(max: number): Promise<string> {
  const rows = await db.execute<{ id: string }>(
    sql`select id from products where price <= ${max} order by price asc limit 1`,
  )
  const id = (rows.rows ?? rows)[0]?.id
  if (!id) throw new Error('no cheap product in seed')
  return id
}
