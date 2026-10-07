import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { cartItems, carts, products, wishlists } from '../db/schema.js'
import { badRequest, notFound } from '../http/errors.js'
import { loadCart, priceCart } from './order.service.js'
import { toProductView } from './catalog.service.js'
import { FREE_SHIPPING_THRESHOLD, MAX_QTY_PER_LINE } from '@aranya/shared'
import type { CartView } from '@aranya/shared'

export async function cartView(userId: string): Promise<CartView> {
  const lines = await loadCart(userId)
  const { subtotal, shipping, total } = priceCart(lines)
  return {
    items: lines,
    subtotal,
    shipping,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  }
}

async function ensureCartRow(userId: string): Promise<void> {
  await db.insert(carts).values({ userId }).onConflictDoNothing()
}

export async function setCartItem(
  userId: string,
  productId: string,
  qty: number,
): Promise<CartView> {
  if (qty < 0 || qty > MAX_QTY_PER_LINE) {
    throw badRequest(`Quantity must be between 0 and ${MAX_QTY_PER_LINE}`, 'qty_out_of_range')
  }

  const productRows = await db
    .select({ id: products.id, stock: products.stock, name: products.name })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  const product = productRows[0]
  if (!product) throw notFound('Product not found', 'product_not_found')

  if (qty > 0 && product.stock < qty) {
    throw badRequest(
      product.stock === 0
        ? `${product.name} is out of stock`
        : `Only ${product.stock} left of ${product.name}`,
      'insufficient_stock',
    )
  }

  await ensureCartRow(userId)

  if (qty === 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
  } else {
    await db
      .insert(cartItems)
      .values({ userId, productId, qty })
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: { qty },
      })
  }

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.userId, userId))
  return cartView(userId)
}

export async function clearCart(userId: string): Promise<CartView> {
  await db.delete(cartItems).where(eq(cartItems.userId, userId))
  return cartView(userId)
}

/** Folds an anonymous guest cart into the signed-in user's cart, capping each line. */
export async function mergeCart(
  userId: string,
  guestItems: Array<{ productId: string; qty: number }>,
): Promise<CartView> {
  if (guestItems.length === 0) return cartView(userId)

  await ensureCartRow(userId)

  const ids = [...new Set(guestItems.map((i) => i.productId))]
  const known = await db
    .select({ id: products.id, stock: products.stock })
    .from(products)
    .where(inArray(products.id, ids))
  const stockById = new Map(known.map((p) => [p.id, p.stock]))

  for (const item of guestItems) {
    const stock = stockById.get(item.productId)
    if (stock === undefined || stock === 0) continue

    const qty = Math.min(Math.max(1, item.qty), Math.min(MAX_QTY_PER_LINE, stock))

    await db
      .insert(cartItems)
      .values({ userId, productId: item.productId, qty })
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: { qty: sql`least(${cartItems.qty} + ${qty}, ${MAX_QTY_PER_LINE})` },
      })
  }

  return cartView(userId)
}

async function wishlistIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ productId: wishlists.productId })
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
  return rows.map((r) => r.productId)
}

export async function wishlistView(userId: string) {
  const ids = await wishlistIds(userId)
  if (ids.length === 0) return []
  const rows = await db.select().from(products).where(inArray(products.id, ids))
  return rows.map(toProductView)
}

export async function toggleWishlist(
  userId: string,
  productId: string,
): Promise<{ ids: string[] }> {
  const productRows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
  if (!productRows[0]) throw notFound('Product not found', 'product_not_found')

  const existing = await db
    .select({ productId: wishlists.productId })
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1)

  if (existing[0]) {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
  } else {
    await db.insert(wishlists).values({ userId, productId }).onConflictDoNothing()
  }

  return { ids: await wishlistIds(userId) }
}
