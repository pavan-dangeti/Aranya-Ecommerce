import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { getCookie } from 'hono/cookie'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  cartSchema,
  cartViewSchema,
  csrfTokenResponseSchema,
  errorResponseSchema,
  addressInputSchema,
  addressSchema,
  orderSchema,
  placeOrderInputSchema,
  productSchema,
  reviewInputSchema,
  reviewSchema,
} from '@aranya/shared'
import { db } from '../db/client.js'
import { addresses, reviews } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { CSRF_COOKIE } from '../middleware/csrf.js'
import * as cartService from '../services/cart.service.js'
import * as orderService from '../services/order.service.js'
import * as catalog from '../services/catalog.service.js'
import { conflict, notFound } from '../http/errors.js'
import type { AppEnv } from '../http/context.js'

const authErrors = {
  401: {
    description: 'Not authenticated',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  422: {
    description: 'Validation failed',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
} as const

const cartResponse = {
  200: { description: 'The cart', content: { 'application/json': { schema: cartViewSchema } } },
}

const reviewsRoute = createRoute({
  method: 'get',
  path: '/api/products/{productId}/reviews',
  tags: ['reviews'],
  summary: 'Approved reviews for a product',
  request: { params: z.object({ productId: z.string().min(1) }) },
  responses: {
    200: {
      description: 'Reviews',
      content: {
        'application/json': {
          schema: z.array(reviewSchema),
        },
      },
    },
  },
})

const createReviewRoute = createRoute({
  method: 'post',
  path: '/api/reviews',
  tags: ['reviews'],
  summary: 'Submit a review for moderation',
  request: { body: { content: { 'application/json': { schema: reviewInputSchema } } } },
  responses: {
    201: {
      description: 'Queued for moderation',
      content: { 'application/json': { schema: reviewSchema } },
    },
    ...authErrors,
  },
})

const getCartRoute = createRoute({
  method: 'get',
  path: '/api/cart',
  tags: ['cart'],
  summary: 'The signed-in customer cart with server-side pricing',
  responses: { ...cartResponse, ...authErrors },
})

const mergeCartRoute = createRoute({
  method: 'post',
  path: '/api/cart/merge',
  tags: ['cart'],
  summary: 'Fold a guest cart into the signed-in cart',
  request: { body: { content: { 'application/json': { schema: cartSchema } } } },
  responses: { ...cartResponse, ...authErrors },
})

const setCartItemRoute = createRoute({
  method: 'put',
  path: '/api/cart/items/{productId}',
  tags: ['cart'],
  summary: 'Set the quantity of one line (0 removes it)',
  request: {
    params: z.object({ productId: z.string().min(1) }),
    body: {
      content: {
        'application/json': { schema: z.object({ qty: z.number().int().min(0).max(10) }) },
      },
    },
  },
  responses: {
    ...cartResponse,
    404: {
      description: 'Product not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...authErrors,
  },
})

const clearCartRoute = createRoute({
  method: 'delete',
  path: '/api/cart',
  tags: ['cart'],
  summary: 'Empty the cart',
  responses: cartResponse,
})

const wishlistRoute = createRoute({
  method: 'get',
  path: '/api/wishlist',
  tags: ['wishlist'],
  summary: 'Wishlisted products',
  responses: {
    200: {
      description: 'Wishlist',
      content: { 'application/json': { schema: z.array(productSchema) } },
    },
    ...authErrors,
  },
})

const toggleWishlistRoute = createRoute({
  method: 'post',
  path: '/api/wishlist/{productId}',
  tags: ['wishlist'],
  summary: 'Toggle one product in the wishlist',
  request: { params: z.object({ productId: z.string().min(1) }) },
  responses: {
    200: {
      description: 'Current wishlist ids',
      content: { 'application/json': { schema: z.object({ ids: z.array(z.string()) }) } },
    },
    ...authErrors,
  },
})

const addressesRoute = createRoute({
  method: 'get',
  path: '/api/addresses',
  tags: ['addresses'],
  summary: 'Saved delivery addresses',
  responses: {
    200: {
      description: 'Addresses',
      content: { 'application/json': { schema: z.array(addressSchema) } },
    },
    ...authErrors,
  },
})

const createAddressRoute = createRoute({
  method: 'post',
  path: '/api/addresses',
  tags: ['addresses'],
  summary: 'Save a delivery address',
  request: { body: { content: { 'application/json': { schema: addressInputSchema } } } },
  responses: {
    201: { description: 'Saved', content: { 'application/json': { schema: addressSchema } } },
    ...authErrors,
  },
})

const updateAddressRoute = createRoute({
  method: 'patch',
  path: '/api/addresses/{id}',
  tags: ['addresses'],
  summary: 'Update a delivery address',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: addressInputSchema } } },
  },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: addressSchema } } },
    ...authErrors,
  },
})

const deleteAddressRoute = createRoute({
  method: 'delete',
  path: '/api/addresses/{id}',
  tags: ['addresses'],
  summary: 'Delete a delivery address',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Deleted',
      content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } },
    },
    ...authErrors,
  },
})

const placeOrderRoute = createRoute({
  method: 'post',
  path: '/api/orders',
  tags: ['orders'],
  summary: 'Check out the server cart. Prices, shipping and stock are recomputed server-side.',
  request: { body: { content: { 'application/json': { schema: placeOrderInputSchema } } } },
  responses: {
    201: { description: 'Order created', content: { 'application/json': { schema: orderSchema } } },
    200: {
      description: 'Idempotent replay of the same checkout',
      content: { 'application/json': { schema: orderSchema } },
    },
    409: {
      description: 'Out of stock',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...authErrors,
  },
})

const myOrdersRoute = createRoute({
  method: 'get',
  path: '/api/orders',
  tags: ['orders'],
  summary: 'The signed-in customer order history',
  responses: {
    200: {
      description: 'Orders',
      content: { 'application/json': { schema: z.array(orderSchema) } },
    },
    ...authErrors,
  },
})

const myOrderRoute = createRoute({
  method: 'get',
  path: '/api/orders/{id}',
  tags: ['orders'],
  summary: 'One order. Customers only ever see their own.',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: 'The order', content: { 'application/json': { schema: orderSchema } } },
    403: {
      description: 'Not your order',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...authErrors,
  },
})

const csrfRoute = createRoute({
  method: 'get',
  path: '/api/auth/csrf',
  tags: ['auth'],
  summary: 'Issue a CSRF token for cookie-authenticated mutations',
  responses: {
    200: {
      description: 'A token to echo in X-CSRF-Token',
      content: { 'application/json': { schema: csrfTokenResponseSchema } },
    },
  },
})

export function commerceRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(reviewsRoute, async (c) => {
    return c.json(await catalog.approvedReviewsForProduct(c.req.param('productId')), 200)
  })

  app.openapi(createReviewRoute, async (c) => {
    const auth = requireAuth(c)
    const body = c.req.valid('json')

    await catalog.productById(body.productId)

    const existing = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, auth.sub), eq(reviews.productId, body.productId)))
      .limit(1)
    if (existing[0]) throw conflict('You have already reviewed this product', 'review_exists')

    const inserted = await db
      .insert(reviews)
      .values({
        productId: body.productId,
        userId: auth.sub,
        author: auth.email.split('@')[0] ?? 'Customer',
        location: body.location,
        rating: body.rating,
        title: body.title,
        body: body.body,
        status: 'Pending',
      })
      .returning()

    const row = inserted[0]!
    return c.json(
      {
        id: row.id,
        productId: row.productId,
        author: row.author,
        location: row.location,
        rating: row.rating,
        title: row.title,
        body: row.body,
        date: row.createdAt.toISOString(),
      },
      201,
    )
  })

  app.openapi(getCartRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await cartService.cartView(auth.sub), 200)
  })

  app.openapi(mergeCartRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await cartService.mergeCart(auth.sub, c.req.valid('json').items), 200)
  })

  app.openapi(setCartItemRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(
      await cartService.setCartItem(auth.sub, c.req.param('productId'), c.req.valid('json').qty),
      200,
    )
  })

  app.openapi(clearCartRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await cartService.clearCart(auth.sub), 200)
  })

  app.openapi(wishlistRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await cartService.wishlistView(auth.sub), 200)
  })

  app.openapi(toggleWishlistRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await cartService.toggleWishlist(auth.sub, c.req.param('productId')), 200)
  })

  app.openapi(addressesRoute, async (c) => {
    const auth = requireAuth(c)
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, auth.sub))
      .orderBy(eq(addresses.isDefault, false))
    return c.json(rows.map(toAddressView), 200)
  })

  app.openapi(createAddressRoute, async (c) => {
    const auth = requireAuth(c)
    const body = c.req.valid('json')
    const existingCount = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, auth.sub))

    const inserted = await db
      .insert(addresses)
      .values({
        ...body,
        userId: auth.sub,
        isDefault: body.isDefault || existingCount.length === 0,
      })
      .returning()

    if (body.isDefault) await clearOtherDefaults(auth.sub, inserted[0]!.id)
    return c.json(toAddressView(inserted[0]!), 201)
  })

  app.openapi(updateAddressRoute, async (c) => {
    const auth = requireAuth(c)
    const id = c.req.param('id')
    await assertOwnAddress(auth.sub, id)
    const body = c.req.valid('json')

    const updated = await db
      .update(addresses)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(addresses.id, id))
      .returning()
    if (body.isDefault) await clearOtherDefaults(auth.sub, id)
    return c.json(toAddressView(updated[0]!), 200)
  })

  app.openapi(deleteAddressRoute, async (c) => {
    const auth = requireAuth(c)
    const id = c.req.param('id')
    await assertOwnAddress(auth.sub, id)
    await db.delete(addresses).where(eq(addresses.id, id))
    return c.json({ ok: true as const }, 200)
  })

  app.openapi(placeOrderRoute, async (c) => {
    const auth = requireAuth(c)
    const body = c.req.valid('json')

    const idemHeader = c.req.header('idempotency-key')
    const idempotencyKey =
      idemHeader && idemHeader !== body.idempotencyKey ? idemHeader : body.idempotencyKey

    const { order, created } = await orderService.placeOrder(auth.sub, { ...body, idempotencyKey })
    return c.json(order, created ? 201 : 200)
  })

  app.openapi(myOrdersRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await orderService.listOrdersForUser(auth.sub), 200)
  })

  app.openapi(myOrderRoute, async (c) => {
    const auth = requireAuth(c)
    return c.json(await orderService.getOrderForUser(auth.sub, c.req.param('id')), 200)
  })

  app.openapi(csrfRoute, (c) => {
    const existing = getCookie(c, CSRF_COOKIE)
    if (existing) return c.json({ token: existing }, 200)
    const token = crypto.randomUUID()
    return c.json({ token }, 200)
  })
}

function toAddressView(row: typeof addresses.$inferSelect) {
  return {
    id: row.id,
    label: row.label,
    fullName: row.fullName,
    phone: row.phone,
    addressLine: row.addressLine,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
  }
}

async function assertOwnAddress(userId: string, id: string): Promise<void> {
  const rows = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .limit(1)
  if (!rows[0]) throw notFound('Address not found', 'address_not_found')
}

async function clearOtherDefaults(userId: string, keepId: string): Promise<void> {
  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)))
  await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, keepId))
}
