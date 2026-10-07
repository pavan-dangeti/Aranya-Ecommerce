import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import {
  adminCustomerQuerySchema,
  adminDashboardSchema,
  adminOrderQuerySchema,
  adminOrderStatusInputSchema,
  adminProductInputSchema,
  adminProductPatchSchema,
  adminProductQuerySchema,
  adminReviewQuerySchema,
  adminReviewStatusInputSchema,
  adminStockInputSchema,
  auditQuerySchema,
  errorResponseSchema,
  idSchema,
  orderSchema,
  pagedAdminReviewsSchema,
  pagedAuditLogSchema,
  pagedCustomersSchema,
  pagedOrdersSchema,
  pagedProductsSchema,
  pageMeta,
  productSchema,
} from '@aranya/shared'
import { type Actor } from '../services/audit.service.js'
import * as admin from '../services/admin.service.js'
import { listAudit } from '../services/audit.service.js'
import type { AppEnv } from '../http/context.js'

const deny = {
  401: {
    description: 'Not authenticated',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  403: {
    description: 'Admin role required',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  422: {
    description: 'Validation failed',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
} as const

const routes = {
  dashboard: createRoute({
    method: 'get',
    path: '/api/admin/dashboard',
    tags: ['admin'],
    summary: 'Aggregated operations metrics',
    responses: {
      200: {
        description: 'Metrics',
        content: { 'application/json': { schema: adminDashboardSchema } },
      },
      ...deny,
    },
  }),

  products: createRoute({
    method: 'get',
    path: '/api/admin/products',
    tags: ['admin'],
    summary: 'Paginated product list',
    request: { query: adminProductQuerySchema },
    responses: {
      200: {
        description: 'Products',
        content: { 'application/json': { schema: pagedProductsSchema } },
      },
      ...deny,
    },
  }),

  createProduct: createRoute({
    method: 'post',
    path: '/api/admin/products',
    tags: ['admin'],
    summary: 'Create a product',
    request: { body: { content: { 'application/json': { schema: adminProductInputSchema } } } },
    responses: {
      201: { description: 'Created', content: { 'application/json': { schema: productSchema } } },
      ...deny,
    },
  }),

  updateProduct: createRoute({
    method: 'patch',
    path: '/api/admin/products/{id}',
    tags: ['admin'],
    summary: 'Update a product',
    request: {
      params: z.object({ id: idSchema }),
      body: { content: { 'application/json': { schema: adminProductPatchSchema } } },
    },
    responses: {
      200: { description: 'Updated', content: { 'application/json': { schema: productSchema } } },
      ...deny,
    },
  }),

  deleteProduct: createRoute({
    method: 'delete',
    path: '/api/admin/products/{id}',
    tags: ['admin'],
    summary: 'Delete an unsold product',
    request: { params: z.object({ id: idSchema }) },
    responses: {
      200: {
        description: 'Deleted',
        content: { 'application/json': { schema: z.object({ ok: z.literal(true) }) } },
      },
      ...deny,
    },
  }),

  stock: createRoute({
    method: 'post',
    path: '/api/admin/products/{id}/stock',
    tags: ['admin'],
    summary: 'Adjust stock and log the movement',
    request: {
      params: z.object({ id: idSchema }),
      body: { content: { 'application/json': { schema: adminStockInputSchema } } },
    },
    responses: {
      200: { description: 'Adjusted', content: { 'application/json': { schema: productSchema } } },
      ...deny,
    },
  }),

  lowStock: createRoute({
    method: 'get',
    path: '/api/admin/inventory/low-stock',
    tags: ['admin'],
    summary: 'Products at or below the low-stock threshold',
    request: { query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(8) }) },
    responses: {
      200: {
        description: 'Low stock products',
        content: { 'application/json': { schema: z.array(productSchema) } },
      },
      ...deny,
    },
  }),

  orders: createRoute({
    method: 'get',
    path: '/api/admin/orders',
    tags: ['admin'],
    summary: 'Paginated order list',
    request: { query: adminOrderQuerySchema },
    responses: {
      200: {
        description: 'Orders',
        content: { 'application/json': { schema: pagedOrdersSchema } },
      },
      ...deny,
    },
  }),

  orderStatus: createRoute({
    method: 'post',
    path: '/api/admin/orders/{id}/status',
    tags: ['admin'],
    summary: 'Move an order through the status state machine',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: adminOrderStatusInputSchema } } },
    },
    responses: {
      200: { description: 'Updated', content: { 'application/json': { schema: orderSchema } } },
      ...deny,
    },
  }),

  customers: createRoute({
    method: 'get',
    path: '/api/admin/customers',
    tags: ['admin'],
    summary: 'Paginated customer list with spend',
    request: { query: adminCustomerQuerySchema },
    responses: {
      200: {
        description: 'Customers',
        content: { 'application/json': { schema: pagedCustomersSchema } },
      },
      ...deny,
    },
  }),

  reviews: createRoute({
    method: 'get',
    path: '/api/admin/reviews',
    tags: ['admin'],
    summary: 'Paginated review moderation queue',
    request: { query: adminReviewQuerySchema },
    responses: {
      200: {
        description: 'Reviews',
        content: { 'application/json': { schema: pagedAdminReviewsSchema } },
      },
      ...deny,
    },
  }),

  reviewStatus: createRoute({
    method: 'post',
    path: '/api/admin/reviews/{id}/status',
    tags: ['admin'],
    summary: 'Approve or reject a review',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: { content: { 'application/json': { schema: adminReviewStatusInputSchema } } },
    },
    responses: {
      200: {
        description: 'Updated',
        content: {
          'application/json': {
            schema: z.object({ id: z.string(), productId: z.string(), status: z.string() }),
          },
        },
      },
      ...deny,
    },
  }),

  audit: createRoute({
    method: 'get',
    path: '/api/admin/audit',
    tags: ['admin'],
    summary: 'Admin action log',
    request: { query: auditQuerySchema },
    responses: {
      200: {
        description: 'Audit entries',
        content: { 'application/json': { schema: pagedAuditLogSchema } },
      },
      ...deny,
    },
  }),
}

export function adminRoutes(app: OpenAPIHono<AppEnv>) {
  // requireAdminMiddleware already rejected anyone who is not an admin.
  const actor = (c: { get: (k: 'auth') => { sub: string; email: string } }): Actor => {
    const auth = c.get('auth')!
    return { id: auth.sub, email: auth.email }
  }

  app.openapi(routes.dashboard, async (c) => c.json(await admin.dashboardStats(), 200))
  app.openapi(routes.lowStock, async (c) =>
    c.json(await admin.lowStockProducts(c.req.valid('query').limit), 200),
  )

  app.openapi(routes.products, async (c) =>
    c.json(await admin.listAdminProducts(c.req.valid('query')), 200),
  )
  app.openapi(routes.createProduct, async (c) =>
    c.json(await admin.createProduct(actor(c), c.req.valid('json')), 201),
  )
  app.openapi(routes.updateProduct, async (c) =>
    c.json(await admin.updateProduct(actor(c), c.req.param('id'), c.req.valid('json')), 200),
  )
  app.openapi(routes.deleteProduct, async (c) => {
    await admin.deleteProduct(actor(c), c.req.param('id'))
    return c.json({ ok: true as const }, 200)
  })
  app.openapi(routes.stock, async (c) =>
    c.json(await admin.adjustStock(actor(c), c.req.param('id'), c.req.valid('json')), 200),
  )

  app.openapi(routes.orders, async (c) =>
    c.json(await admin.listAdminOrders(c.req.valid('query')), 200),
  )
  app.openapi(routes.orderStatus, async (c) => {
    const { status } = c.req.valid('json')
    return c.json(await admin.changeOrderStatus(actor(c), c.req.param('id'), status), 200)
  })

  app.openapi(routes.customers, async (c) =>
    c.json(await admin.listAdminCustomers(c.req.valid('query')), 200),
  )

  app.openapi(routes.reviews, async (c) =>
    c.json(await admin.listAdminReviews(c.req.valid('query')), 200),
  )
  app.openapi(routes.reviewStatus, async (c) => {
    const { status } = c.req.valid('json')
    return c.json(await admin.moderateReview(actor(c), c.req.param('id'), status), 200)
  })

  app.openapi(routes.audit, async (c) => {
    const { page: p, pageSize, entity, entityId } = c.req.valid('query')
    const result = await listAudit({
      ...(entity ? { entity } : {}),
      ...(entityId ? { entityId } : {}),
      limit: pageSize,
      offset: (p - 1) * pageSize,
    })
    return c.json({ items: result.items, ...pageMeta(p, pageSize, result.total) }, 200)
  })
}
