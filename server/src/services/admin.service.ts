import { eq, and, asc, desc, or, inArray, sql, ilike, type SQL } from 'drizzle-orm'
import { db, type Tx } from '../db/client.js'
import { inventoryMovements, orderItems, orders, products, reviews } from '../db/schema.js'
import { badRequest, conflict, notFound } from '../http/errors.js'
import { record, type Actor } from './audit.service.js'
import {
  canTransition,
  slugify,
  CRITICAL_STOCK_THRESHOLD,
  LOW_STOCK_THRESHOLD,
  pageMeta,
} from '@aranya/shared'
import type {
  AdminCustomerQuery,
  AdminOrderQuery,
  AdminProductInput,
  AdminProductPatch,
  AdminProductQuery,
  AdminReviewQuery,
  OrderStatus,
} from '@aranya/shared'
import { toProductView, refreshProductRating } from './catalog.service.js'
import { toOrderView } from './order.service.js'

const DEFAULT_VISUAL = {
  form: 'flask',
  glass: '#59431f',
  liquid: '#86682f',
  label: '#f4efe3',
  accent: '#c29a64',
} as const

function newProductId(): string {
  return `arn-${crypto.randomUUID().slice(0, 8)}`
}

const ADMIN_SORTS = {
  products: {
    'name-asc': [asc(products.name)],
    'name-desc': [desc(products.name)],
    'price-asc': [asc(products.price)],
    'price-desc': [desc(products.price)],
    'stock-asc': [asc(products.stock)],
    'stock-desc': [desc(products.stock)],
    newest: [desc(products.createdAt)],
  },
  orders: {
    newest: [desc(orders.placedAt)],
    oldest: [asc(orders.placedAt)],
    'total-desc': [desc(orders.total)],
    'total-asc': [asc(orders.total)],
  },
  reviews: {
    newest: [desc(reviews.createdAt)],
    oldest: [asc(reviews.createdAt)],
    'rating-desc': [desc(reviews.rating)],
    'rating-asc': [asc(reviews.rating)],
  },
} as const

export async function listAdminProducts(query: AdminProductQuery) {
  const conditions = []
  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(or(ilike(products.name, term), ilike(products.slug, term))!)
  }
  if (query.category) conditions.push(eq(products.category, query.category))
  if (query.stockState === 'in') conditions.push(sql`${products.stock} > ${LOW_STOCK_THRESHOLD}`)
  if (query.stockState === 'low')
    conditions.push(sql`${products.stock} > 0 and ${products.stock} <= ${LOW_STOCK_THRESHOLD}`)
  if (query.stockState === 'critical')
    conditions.push(sql`${products.stock} > 0 and ${products.stock} <= ${CRITICAL_STOCK_THRESHOLD}`)
  if (query.stockState === 'out') conditions.push(eq(products.stock, 0))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = ADMIN_SORTS.products[query.sort]

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderBy)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where)

  return {
    items: rows.map(toProductView),
    ...pageMeta(query.page, query.pageSize, Number(countRow?.count ?? 0)),
  }
}

export async function createProduct(actor: Actor, input: AdminProductInput) {
  const slug = await uniqueSlug(input.slug ?? slugify(input.name))

  const rows = await db
    .insert(products)
    .values({
      id: newProductId(),
      slug,
      name: input.name,
      category: input.category,
      description: input.description,
      shortDescription: input.shortDescription,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      stock: input.stock,
      origin: input.origin,
      usage: input.usage,
      tags: input.tags,
      benefits: input.benefits,
      ingredients: input.ingredients,
      visual: DEFAULT_VISUAL,
      featured: input.featured ?? false,
      isNew: input.isNew ?? true,
    })
    .returning()

  const product = rows[0]
  if (!product) throw new Error('product insert returned no row')

  await record(actor, {
    action: 'product.create',
    entity: 'product',
    entityId: product.id,
    meta: { slug },
  })
  return toProductView(product)
}

export async function updateProduct(actor: Actor, id: string, input: AdminProductPatch) {
  const current = await db.select().from(products).where(eq(products.id, id)).limit(1)
  const existing = current[0]
  if (!existing) throw notFound('Product not found', 'product_not_found')

  const patch: Partial<typeof products.$inferInsert> = { updatedAt: new Date() }

  if (input.name !== undefined) patch.name = input.name
  if (input.slug !== undefined) patch.slug = await uniqueSlug(input.slug, id)
  if (input.category !== undefined) patch.category = input.category
  if (input.description !== undefined) patch.description = input.description
  if (input.shortDescription !== undefined) patch.shortDescription = input.shortDescription
  if (input.price !== undefined) patch.price = input.price
  if (input.compareAtPrice !== undefined) patch.compareAtPrice = input.compareAtPrice
  if (input.stock !== undefined) patch.stock = input.stock
  if (input.origin !== undefined) patch.origin = input.origin
  if (input.usage !== undefined) patch.usage = input.usage
  if (input.tags !== undefined) patch.tags = input.tags
  if (input.benefits !== undefined) patch.benefits = input.benefits
  if (input.ingredients !== undefined) patch.ingredients = input.ingredients
  if (input.featured !== undefined) patch.featured = input.featured
  if (input.isNew !== undefined) patch.isNew = input.isNew

  const rows = await db.update(products).set(patch).where(eq(products.id, id)).returning()
  const product = rows[0]
  if (!product) throw notFound('Product not found', 'product_not_found')

  await record(actor, {
    action: 'product.update',
    entity: 'product',
    entityId: id,
    meta: { fields: Object.keys(patch).filter((k) => k !== 'updatedAt') },
  })
  return toProductView(product)
}

export async function deleteProduct(actor: Actor, id: string): Promise<void> {
  const sold = await db
    .select({ orderId: orderItems.orderId })
    .from(orderItems)
    .where(eq(orderItems.productId, id))
    .limit(1)

  if (sold[0]) {
    throw conflict(
      'This product appears in past orders. Set its stock to 0 instead of deleting it.',
      'product_in_use',
    )
  }

  const deleted = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id })
  if (deleted.length === 0) throw notFound('Product not found', 'product_not_found')

  await record(actor, { action: 'product.delete', entity: 'product', entityId: id })
}

export async function adjustStock(
  actor: Actor,
  id: string,
  input: { stock: number; reason?: string },
): Promise<ReturnType<typeof toProductView>> {
  return db.transaction(async (tx) => {
    const locked = await tx
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(eq(products.id, id))
      .for('update')

    const row = locked[0]
    if (!row) throw notFound('Product not found', 'product_not_found')

    const delta = input.stock - row.stock

    const updated = await tx
      .update(products)
      .set({ stock: input.stock, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()

    await tx.insert(inventoryMovements).values({
      productId: id,
      delta,
      reason: input.reason?.slice(0, 60) || 'manual_adjustment',
      note: input.reason?.slice(0, 200) ?? null,
      actorId: actor.id,
    })

    await record(
      actor,
      {
        action: 'inventory.adjust',
        entity: 'product',
        entityId: id,
        meta: { from: row.stock, to: input.stock, delta },
      },
      tx,
    )

    const product = updated[0]
    if (!product) throw notFound('Product not found', 'product_not_found')
    return toProductView(product)
  })
}

export async function lowStockProducts(limit = 8) {
  const rows = await db
    .select()
    .from(products)
    .where(sql`${products.stock} <= ${LOW_STOCK_THRESHOLD}`)
    .orderBy(asc(products.stock))
    .limit(limit)
  return rows.map(toProductView)
}

export async function listAdminOrders(query: AdminOrderQuery) {
  const conditions = []
  if (query.status) conditions.push(eq(orders.status, query.status))
  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(
      or(
        ilike(orders.reference, term),
        sql`${orders.id}::text ilike ${term}`,
        sql`${orders.address}->>'email' ilike ${term}`,
        sql`${orders.address}->>'fullName' ilike ${term}`,
      )!,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = ADMIN_SORTS.orders[query.sort]

  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(...orderBy)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(where)

  const itemsByOrder =
    rows.length === 0
      ? new Map<string, (typeof orderItems.$inferSelect)[]>()
      : (
          await db
            .select()
            .from(orderItems)
            .where(
              inArray(
                orderItems.orderId,
                rows.map((r) => r.id),
              ),
            )
        ).reduce<Map<string, (typeof orderItems.$inferSelect)[]>>((acc, item) => {
          const list = acc.get(item.orderId) ?? []
          list.push(item)
          acc.set(item.orderId, list)
          return acc
        }, new Map())

  return {
    items: rows.map((r) => toOrderView(r, itemsByOrder.get(r.id) ?? [])),
    ...pageMeta(query.page, query.pageSize, Number(countRow?.count ?? 0)),
  }
}

export async function changeOrderStatus(actor: Actor, orderId: string, status: OrderStatus) {
  return db.transaction(async (tx) => {
    const locked = await tx
      .select({
        id: orders.id,
        reference: orders.reference,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .for('update')

    const row = locked[0]
    if (!row) throw notFound('Order not found', 'order_not_found')

    if (row.status === status) return await hydrate(tx, row.id)

    if (!canTransition(row.status, status)) {
      throw badRequest(`Cannot move an order from ${row.status} to ${status}`, 'invalid_transition')
    }

    if (status === 'Cancelled') {
      const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, row.id))
      for (const line of lines) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${line.qty}`, updatedAt: new Date() })
          .where(eq(products.id, line.productId))
        await tx.insert(inventoryMovements).values({
          productId: line.productId,
          delta: line.qty,
          reason: 'order_cancelled',
          note: row.reference,
          actorId: actor.id,
          orderId: row.id,
        })
      }
    }

    await tx
      .update(orders)
      .set({
        status,
        ...(status === 'Cancelled' && row.paymentStatus === 'captured'
          ? { paymentStatus: 'refunded' as const }
          : {}),
      })
      .where(eq(orders.id, row.id))

    await record(
      actor,
      {
        action: 'order.status_change',
        entity: 'order',
        entityId: row.id,
        meta: { from: row.status, to: status },
      },
      tx,
    )

    return await hydrate(tx, row.id)
  })
}

async function hydrate(tx: Tx, orderId: string) {
  const rows = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1)
  const order = rows[0]
  if (!order) throw notFound('Order not found', 'order_not_found')
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  return toOrderView(order, items)
}

export async function listAdminCustomers(query: AdminCustomerQuery) {
  // Raw SQL because the orders aggregate is joined as a lateral `o`; drizzle
  // column refs would emit `"users"."name"` and miss the `u` alias.
  const filters: SQL[] = []
  if (query.search) {
    const term = `%${query.search}%`
    filters.push(sql`(u.name ilike ${term} or u.email ilike ${term})`)
  }
  if (query.status === 'VIP') {
    filters.push(sql`(coalesce(o.spent, 0) >= 7000 or coalesce(o.orders, 0) >= 7)`)
  } else if (query.status === 'Dormant') {
    filters.push(sql`coalesce(o.orders, 0) = 0`)
  } else if (query.status === 'Active') {
    filters.push(sql`(coalesce(o.orders, 0) between 1 and 6 and coalesce(o.spent, 0) < 7000)`)
  }
  const where = filters.length > 0 ? sql`and ${sql.join(filters, sql` and `)}` : sql``

  const orderBy = {
    'spent-desc': sql`o.spent desc nulls last`,
    'spent-asc': sql`o.spent asc nulls last`,
    'orders-desc': sql`o.orders desc nulls last`,
    'name-asc': sql`u.name asc`,
  }[query.sort]

  const rows = await db.execute<{
    id: string
    name: string
    email: string
    orders: number
    spent: number
    city: string
    member_since: Date
  }>(sql`
    select
      u.id,
      u.name,
      u.email,
      coalesce(o.orders, 0)::int as orders,
      coalesce(o.spent, 0)::int as spent,
      coalesce(o.city, '') as city,
      u.member_since
    from users u
    left join lateral (
      select
        count(*)::int as orders,
        sum(total)::int as spent,
        (array_agg(address->>'city' order by placed_at desc))[1] as city
      from orders
      where orders.user_id = u.id and orders.status <> 'Cancelled'
    ) o on true
    where u.role = 'customer'
    ${where}
    order by ${orderBy}, u.id asc
    limit ${query.pageSize}
    offset ${(query.page - 1) * query.pageSize}
  `)

  const customerRows = rows.rows ?? rows
  const countResult = await db.execute<{ count: number }>(sql`
    select count(*)::int as count
    from users u
    left join lateral (
      select count(*)::int as orders, sum(total)::int as spent
      from orders
      where orders.user_id = u.id and orders.status <> 'Cancelled'
    ) o on true
    where u.role = 'customer'
    ${where}
  `)

  const count = Number((countResult.rows ?? countResult)[0]?.count ?? 0)

  return {
    items: customerRows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      city: r.city || '—',
      orders: r.orders,
      spent: r.spent,
      status: customerStatus(r.orders, r.spent),
      memberSince: new Date(r.member_since).toISOString(),
    })),
    ...pageMeta(query.page, query.pageSize, count),
  }
}

function customerStatus(orders: number, spent: number): 'Active' | 'VIP' | 'Dormant' {
  if (spent >= 7000 || orders >= 7) return 'VIP'
  if (orders === 0) return 'Dormant'
  return 'Active'
}

export async function listAdminReviews(query: AdminReviewQuery) {
  const conditions = []
  if (query.status) conditions.push(eq(reviews.status, query.status))
  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(
      or(ilike(reviews.title, term), ilike(reviews.author, term), ilike(reviews.body, term))!,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = {
    newest: [desc(reviews.createdAt)],
    oldest: [asc(reviews.createdAt)],
    'rating-desc': [desc(reviews.rating)],
    'rating-asc': [asc(reviews.rating)],
  }[query.sort]

  const rows = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      productName: products.name,
      author: reviews.author,
      location: reviews.location,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      status: reviews.status,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(where)

  return {
    items: rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName,
      author: r.author,
      location: r.location,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      date: r.createdAt.toISOString(),
    })),
    ...pageMeta(query.page, query.pageSize, Number(countRow?.count ?? 0)),
  }
}

export async function moderateReview(
  actor: Actor,
  id: string,
  status: 'Pending' | 'Approved' | 'Rejected',
) {
  const rows = await db
    .update(reviews)
    .set({ status, updatedAt: new Date() })
    .where(eq(reviews.id, id))
    .returning()
  const review = rows[0]
  if (!review) throw notFound('Review not found', 'review_not_found')

  await record(actor, {
    action: 'review.moderate',
    entity: 'review',
    entityId: id,
    meta: { status, productId: review.productId },
  })

  await refreshProductRating(review.productId)

  return { id: review.id, productId: review.productId, status: review.status }
}

export async function dashboardStats() {
  const totalsResult = await db.execute<{
    revenue: number
    orders: number
    customers: number
    products: number
    low_stock: number
  }>(sql`
    select
      coalesce((select sum(total) from orders where status <> 'Cancelled'), 0)::int as revenue,
      (select count(*) from orders where status <> 'Cancelled')::int as orders,
      (select count(*) from users where role = 'customer')::int as customers,
      (select count(*) from products)::int as products,
      (select count(*) from products where stock <= ${LOW_STOCK_THRESHOLD})::int as low_stock
  `)

  const pending = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.status, 'Pending'))

  const revenueRows = await db.execute<{ label: string; value: number }>(sql`
    select to_char(d.month, 'Mon') as label, coalesce(sum(o.total), 0)::int as value
    from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') d(month)
    left join orders o on date_trunc('month', o.placed_at) = d.month and o.status <> 'Cancelled'
    group by d.month
    order by d.month
  `)

  const statusRows = await db.execute<{ label: string; value: number }>(sql`
    select status::text as label, count(*)::int as value from orders group by status order by status
  `)

  const topRows = await db.execute<{ name: string; units: number; revenue: number }>(sql`
    select p.name, sum(oi.qty)::int as units, sum(oi.qty * oi.price)::int as revenue
    from order_items oi
    join orders o on o.id = oi.order_id and o.status <> 'Cancelled'
    join products p on p.id = oi.product_id
    group by p.name
    order by units desc
    limit 5
  `)

  const recentRows = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      total: orders.total,
      status: orders.status,
      placedAt: orders.placedAt,
      customer: orders.address,
    })
    .from(orders)
    .orderBy(desc(orders.placedAt))
    .limit(6)

  const totals = totalsResult.rows[0]
  if (!totals) throw new Error('dashboard query returned no row')

  return {
    revenue: totals.revenue,
    orders: totals.orders,
    customers: totals.customers,
    products: totals.products,
    lowStock: totals.low_stock,
    pendingReviews: Number(pending[0]?.count ?? 0),
    revenueSeries: (revenueRows.rows ?? revenueRows).map((r) => ({
      label: r.label,
      value: r.value,
    })),
    statusBreakdown: (statusRows.rows ?? statusRows).map((r) => ({
      label: r.label,
      value: r.value,
    })),
    topProducts: (topRows.rows ?? topRows).map((r) => ({
      name: r.name,
      units: r.units,
      revenue: r.revenue,
    })),
    recentOrders: recentRows.map((r) => ({
      id: r.id,
      reference: r.reference,
      customer: (r.customer as { fullName?: string }).fullName ?? 'Guest',
      total: r.total,
      status: r.status,
      placedAt: r.placedAt.toISOString(),
    })),
  }
}

async function uniqueSlug(candidate: string, excludeId?: string): Promise<string> {
  const base = slugify(candidate)
  let slug = base
  let n = 2

  for (;;) {
    const clash = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1)
    if (clash.length === 0 || clash[0]?.id === excludeId) return slug
    slug = `${base}-${n++}`
    if (n > 200) return `${base}-${Date.now().toString(36)}`
  }
}
