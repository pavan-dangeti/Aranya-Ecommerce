import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { db } from '../db/client.js'
import {
  cartItems,
  inventoryMovements,
  orderItems,
  orders,
  products,
  type OrderItemRow,
  type OrderRow,
} from '../db/schema.js'
import { badRequest, conflict, notFound, AppError } from '../http/errors.js'
import { paymentProvider } from './payment/index.js'
import {
  estimatedDeliveryFrom,
  orderSchema,
  shippingFor,
  MAX_QTY_PER_LINE,
  type Order,
  type OrderAddress,
  type PaymentMethod,
  type ProductVisual,
} from '@aranya/shared'

export interface CartLine {
  productId: string
  qty: number
  name: string
  slug: string
  price: number
  stock: number
  visual: ProductVisual
}

function makeReference(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = randomBytes(3).toString('hex').toUpperCase()
  return `ARN-${stamp}-${rand}`
}

export function toOrderView(row: OrderRow, items: OrderItemRow[]): Order {
  return orderSchema.parse({
    id: row.id,
    reference: row.reference,
    userId: row.userId,
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      slug: i.slug,
      qty: i.qty,
      price: i.price,
    })),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    address: row.address,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    paymentRef: row.paymentRef,
    status: row.status,
    placedAt: row.placedAt.toISOString(),
    estimatedDelivery: row.estimatedDelivery.toISOString(),
  })
}

export async function loadCart(userId: string): Promise<CartLine[]> {
  const rows = await db
    .select({
      productId: cartItems.productId,
      qty: cartItems.qty,
      name: products.name,
      slug: products.slug,
      price: products.price,
      stock: products.stock,
      visual: products.visual,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(products.name)

  return rows.map((r) => ({
    productId: r.productId,
    qty: r.qty,
    name: r.name,
    slug: r.slug,
    price: r.price,
    stock: r.stock,
    visual: r.visual as ProductVisual,
  }))
}

export function priceCart(lines: Pick<CartLine, 'price' | 'qty'>[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  const shipping = shippingFor(subtotal)
  return { subtotal, shipping, total: subtotal + shipping }
}

/**
 * Reserves stock and creates the order in one transaction, so two shoppers racing
 * for the last unit cannot both win. Payment is charged after the commit and the
 * reservation is released if the charge fails.
 */
export async function placeOrder(
  userId: string,
  input: {
    address: OrderAddress
    paymentMethod: PaymentMethod
    upiId?: string
    idempotencyKey: string
  },
): Promise<{ order: Order; created: boolean }> {
  const existing = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, input.idempotencyKey)))
    .limit(1)

  if (existing[0]) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, existing[0].id))
    return { order: toOrderView(existing[0], items), created: false }
  }

  const cart = await loadCart(userId)
  if (cart.length === 0) throw badRequest('Your cart is empty', 'cart_empty')

  const oversubscribed = cart.find((l) => l.qty > MAX_QTY_PER_LINE)
  if (oversubscribed) {
    throw badRequest(
      `Limit ${MAX_QTY_PER_LINE} units per product (${oversubscribed.name})`,
      'qty_limit_exceeded',
    )
  }

  const productIds = [...cart.map((l) => l.productId)].sort()

  const reserved = await db.transaction(async (tx) => {
    // Lock in a stable order so two carts racing for the same products cannot deadlock.
    const lockedRows = await tx
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        price: products.price,
        stock: products.stock,
      })
      .from(products)
      .where(inArray(products.id, productIds))
      .orderBy(asc(products.id))
      .for('update')

    if (lockedRows.length !== productIds.length) {
      throw badRequest('One or more items are no longer available', 'product_missing')
    }

    const byId = new Map(lockedRows.map((r) => [r.id, r]))

    for (const line of cart) {
      const row = byId.get(line.productId)
      if (!row) throw badRequest(`${line.name} is no longer available`, 'product_missing')
      if (row.stock < line.qty) {
        throw conflict(
          row.stock === 0 ? `${row.name} just sold out` : `Only ${row.stock} left of ${row.name}`,
          'insufficient_stock',
        )
      }
    }

    const priced = cart.map((line) => {
      const row = byId.get(line.productId)!
      return {
        productId: line.productId,
        name: row.name,
        slug: row.slug,
        qty: line.qty,
        price: row.price,
      }
    })

    const { subtotal, shipping, total } = priceCart(priced)

    const reference = makeReference()
    const inserted = await tx
      .insert(orders)
      .values({
        reference,
        userId,
        status: 'Pending',
        subtotal,
        shipping,
        total,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'pending',
        idempotencyKey: input.idempotencyKey,
        address: input.address,
        estimatedDelivery: new Date(estimatedDeliveryFrom()),
      })
      .returning()

    const order = inserted[0]
    if (!order) throw new Error('order insert returned no row')

    await tx.insert(orderItems).values(
      priced.map((p) => ({
        orderId: order.id,
        productId: p.productId,
        name: p.name,
        slug: p.slug,
        qty: p.qty,
        price: p.price,
      })),
    )

    for (const line of priced) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${line.qty}`, updatedAt: new Date() })
        .where(eq(products.id, line.productId))

      await tx.insert(inventoryMovements).values({
        productId: line.productId,
        delta: -line.qty,
        reason: 'order_placed',
        note: reference,
        actorId: userId,
        orderId: order.id,
      })
    }

    await tx.delete(cartItems).where(eq(cartItems.userId, userId))

    return order
  })

  const charge = await paymentProvider().charge({
    orderReference: reserved.reference,
    orderId: reserved.id,
    amount: reserved.total,
    currency: 'INR',
    method: input.paymentMethod,
    ...(input.upiId ? { upiId: input.upiId } : {}),
    customerEmail: input.address.email,
  })

  if (!charge.ok) {
    await releaseOrder(reserved.id, userId, charge.message)
    throw new AppError(402, 'payment_failed', charge.message, undefined)
  }

  const paid = await db
    .update(orders)
    .set({ paymentStatus: charge.status, paymentRef: charge.providerRef })
    .where(eq(orders.id, reserved.id))
    .returning()

  const finalRow = paid[0] ?? reserved
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, finalRow.id))

  return { order: toOrderView(finalRow, items), created: true }
}

/** Puts stock back and cancels the order when the gateway refuses the charge. */
async function releaseOrder(orderId: string, userId: string, reason: string): Promise<void> {
  await db.transaction(async (tx) => {
    const lines = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId))
    for (const line of lines) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${line.qty}`, updatedAt: new Date() })
        .where(eq(products.id, line.productId))
      await tx.insert(inventoryMovements).values({
        productId: line.productId,
        delta: line.qty,
        reason: 'payment_failed',
        note: reason.slice(0, 200),
        actorId: userId,
        orderId,
      })
    }
    await tx
      .update(orders)
      .set({ status: 'Cancelled', paymentStatus: 'failed' })
      .where(eq(orders.id, orderId))
  })
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.placedAt))

  if (rows.length === 0) return []

  const items = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.id),
      ),
    )

  const byOrder = new Map<string, OrderItemRow[]>()
  for (const item of items) {
    const list = byOrder.get(item.orderId) ?? []
    list.push(item)
    byOrder.set(item.orderId, list)
  }

  return rows.map((r) => toOrderView(r, byOrder.get(r.id) ?? []))
}

export async function getOrderForUser(userId: string, orderId: string): Promise<Order> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
  const order = rows[0]
  if (!order) throw notFound('Order not found', 'order_not_found')
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
  return toOrderView(order, items)
}
