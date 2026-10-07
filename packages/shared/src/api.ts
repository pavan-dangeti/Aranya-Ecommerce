import { z } from './z.js'
import {
  emailSchema,
  idSchema,
  paginated,
  passwordSchema,
  phoneSchema,
  priceSchema,
} from './common.js'
import {
  adminCustomerSchema,
  auditLogEntrySchema,
  categoryIdSchema,
  orderSchema,
  orderStatusSchema,
} from './domain.js'

export const registerInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(120),
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema.optional(),
  })
  .openapi('RegisterInput')

export const loginInputSchema = z
  .object({ email: emailSchema, password: z.string().min(1, 'Enter your password').max(128) })
  .openapi('LoginInput')

export const forgotPasswordInputSchema = z
  .object({ email: emailSchema })
  .openapi('ForgotPasswordInput')

export const resetPasswordInputSchema = z
  .object({ token: z.string().min(10), password: passwordSchema })
  .openapi('ResetPasswordInput')

export const reviewInputSchema = z
  .object({
    productId: idSchema,
    rating: z.number().int().min(1, 'Pick a rating').max(5),
    title: z.string().trim().min(3, 'Add a short title').max(120),
    body: z.string().trim().min(10, 'Tell us a little more').max(2000),
    location: z.string().trim().min(2).max(80).default('India'),
  })
  .openapi('ReviewInput')

export const refreshInputSchema = z.object({}).openapi('RefreshInput')

export const updateProfileInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(120).optional(),
    phone: phoneSchema.optional(),
  })
  .openapi('UpdateProfileInput')

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
  })
  .openapi('ChangePasswordInput')

export const authResponseSchema = z
  .object({
    accessToken: z.string().min(20),
    tokenType: z.literal('Bearer').default('Bearer'),
    user: z
      .object({
        id: idSchema,
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        role: z.enum(['customer', 'admin']),
        memberSince: z.string(),
      })
      .openapi('SessionUser'),
    expiresIn: z.number().int().positive(),
  })
  .openapi('AuthResponse')

export const ADMIN_PRODUCT_SORTS = [
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
  'stock-asc',
  'stock-desc',
  'newest',
] as const
export const adminProductSortSchema = z.enum(ADMIN_PRODUCT_SORTS).openapi('AdminProductSort')
export type AdminProductSort = z.infer<typeof adminProductSortSchema>

export const adminProductInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(160)
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes')
      .optional(),
    category: z.enum([
      'herbal-supplements',
      'skin-care',
      'hair-care',
      'wellness',
      'herbal-drinks',
      'personal-care',
    ]),
    description: z.string().trim().min(20).max(4000),
    shortDescription: z.string().trim().min(10).max(300),
    price: priceSchema,
    compareAtPrice: priceSchema.optional(),
    stock: z.number().int().min(0).max(1_000_000),
    origin: z.string().trim().min(2).max(160),
    usage: z.string().trim().min(5).max(600),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    benefits: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
    ingredients: z
      .array(
        z.object({ name: z.string().trim().min(1).max(120), note: z.string().trim().max(300) }),
      )
      .max(30)
      .default([]),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
  })
  .openapi('AdminProductInput')

export const adminProductPatchSchema = adminProductInputSchema
  .partial()
  .openapi('AdminProductPatch')

export const adminStockInputSchema = z
  .object({
    stock: z.number().int().min(0).max(1_000_000),
    reason: z.string().trim().max(200).optional(),
  })
  .openapi('AdminStockInput')

export const adminOrderStatusInputSchema = z
  .object({ status: orderStatusSchema })
  .openapi('AdminOrderStatusInput')

export const adminReviewStatusInputSchema = z
  .object({ status: z.enum(['Pending', 'Approved', 'Rejected']) })
  .openapi('AdminReviewStatusInput')

export const adminOrderQuerySchema = z
  .object({
    status: orderStatusSchema.optional(),
    search: z.string().trim().max(120).optional(),
    sort: z.enum(['newest', 'oldest', 'total-desc', 'total-asc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi('AdminOrderQuery')

export const adminCustomerQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: z.enum(['Active', 'VIP', 'Dormant']).optional(),
    sort: z.enum(['spent-desc', 'spent-asc', 'orders-desc', 'name-asc']).default('spent-desc'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi('AdminCustomerQuery')

export const adminReviewQuerySchema = z
  .object({
    status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
    search: z.string().trim().max(120).optional(),
    sort: z.enum(['newest', 'oldest', 'rating-desc', 'rating-asc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi('AdminReviewQuery')

export const adminProductQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: z
      .enum([
        'herbal-supplements',
        'skin-care',
        'hair-care',
        'wellness',
        'herbal-drinks',
        'personal-care',
      ])
      .optional(),
    stockState: z.enum(['all', 'in', 'low', 'critical', 'out']).default('all'),
    sort: adminProductSortSchema.default('name-asc'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi('AdminProductQuery')

export const auditQuerySchema = z
  .object({
    entity: z.string().trim().max(40).optional(),
    entityId: z.string().trim().max(64).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .openapi('AuditQuery')

export type AuditQuery = z.infer<typeof auditQuerySchema>

export const adminDashboardSchema = z
  .object({
    revenue: priceSchema,
    orders: z.number().int().min(0),
    customers: z.number().int().min(0),
    products: z.number().int().min(0),
    pendingReviews: z.number().int().min(0),
    lowStock: z.number().int().min(0),
    revenueSeries: z.array(z.object({ label: z.string(), value: priceSchema })),
    statusBreakdown: z.array(z.object({ label: z.string(), value: z.number().int().min(0) })),
    topProducts: z.array(
      z.object({ name: z.string(), units: z.number().int().min(0), revenue: priceSchema }),
    ),
    recentOrders: z.array(
      z.object({
        id: idSchema,
        reference: z.string(),
        customer: z.string(),
        total: priceSchema,
        status: orderStatusSchema,
        placedAt: z.string(),
      }),
    ),
  })
  .openapi('AdminDashboard')

export const adminReviewViewSchema = z
  .object({
    id: z.string(),
    productId: idSchema,
    productName: z.string(),
    author: z.string(),
    location: z.string(),
    rating: z.number().int().min(1).max(5),
    title: z.string(),
    body: z.string(),
    status: z.enum(['Pending', 'Approved', 'Rejected']),
    date: z.string(),
  })
  .openapi('AdminReviewView')

export const pagedCustomersSchema = paginated(adminCustomerSchema, 'PagedCustomers')
export const pagedOrdersSchema = paginated(orderSchema, 'PagedOrders')
export const pagedAdminReviewsSchema = paginated(adminReviewViewSchema, 'PagedAdminReviews')
export const pagedAuditLogSchema = paginated(auditLogEntrySchema, 'PagedAuditLog')

export type AdminReviewView = z.infer<typeof adminReviewViewSchema>
export type PagedCustomers = z.infer<typeof pagedCustomersSchema>
export type PagedOrders = z.infer<typeof pagedOrdersSchema>
export type PagedAdminReviews = z.infer<typeof pagedAdminReviewsSchema>
export type PagedAuditLog = z.infer<typeof pagedAuditLogSchema>

export type ReviewInput = z.infer<typeof reviewInputSchema>
export type AdminDashboard = z.infer<typeof adminDashboardSchema>
export type AdminCustomerQuery = z.infer<typeof adminCustomerQuerySchema>
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>
export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>

/**
 * Caller-side shapes for the admin lists. Written out rather than derived with
 * `z.input`, because `z.coerce.*().default()` collapses the inferred input to
 * `unknown`. Every field the server defaults is optional here.
 */
export interface AdminProductQueryInput {
  search?: string
  category?: z.infer<typeof categoryIdSchema>
  stockState?: 'all' | 'in' | 'low' | 'critical' | 'out'
  sort?: AdminProductSort
  page?: number
  pageSize?: number
}

export interface AdminOrderQueryInput {
  status?: z.infer<typeof orderStatusSchema>
  search?: string
  sort?: 'newest' | 'oldest' | 'total-desc' | 'total-asc'
  page?: number
  pageSize?: number
}

export interface AdminCustomerQueryInput {
  search?: string
  status?: 'Active' | 'VIP' | 'Dormant'
  sort?: 'spent-desc' | 'spent-asc' | 'orders-desc' | 'name-asc'
  page?: number
  pageSize?: number
}

export interface AdminReviewQueryInput {
  status?: 'Pending' | 'Approved' | 'Rejected'
  search?: string
  sort?: 'newest' | 'oldest' | 'rating-desc' | 'rating-asc'
  page?: number
  pageSize?: number
}
export type AdminReviewQuery = z.infer<typeof adminReviewQuerySchema>
export type AdminProductInput = z.infer<typeof adminProductInputSchema>
export type AdminProductPatch = z.infer<typeof adminProductPatchSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
