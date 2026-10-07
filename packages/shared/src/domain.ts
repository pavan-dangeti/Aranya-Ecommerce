import { z } from './z.js'
import {
  emailSchema,
  idSchema,
  paginated,
  phoneSchema,
  postalCodeSchema,
  priceSchema,
  upiIdSchema,
} from './common.js'

export const CATEGORY_IDS = [
  'herbal-supplements',
  'skin-care',
  'hair-care',
  'wellness',
  'herbal-drinks',
  'personal-care',
] as const

export const categoryIdSchema = z.enum(CATEGORY_IDS).openapi('CategoryId')
export type CategoryId = z.infer<typeof categoryIdSchema>

export const BOTTLE_FORMS = ['dropper', 'jar', 'pump', 'flask', 'tin', 'tube'] as const
export const bottleFormSchema = z.enum(BOTTLE_FORMS).openapi('BottleForm')
export type BottleForm = z.infer<typeof bottleFormSchema>

export const categorySchema = z
  .object({
    id: categoryIdSchema,
    name: z.string(),
    tagline: z.string(),
  })
  .openapi('Category')

export const productVisualSchema = z
  .object({
    form: bottleFormSchema,
    glass: z.string(),
    liquid: z.string(),
    label: z.string(),
    accent: z.string(),
  })
  .openapi('ProductVisual')

export const productIngredientSchema = z
  .object({ name: z.string(), note: z.string() })
  .openapi('ProductIngredient')

export const productSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    slug: z.string(),
    category: categoryIdSchema,
    description: z.string(),
    shortDescription: z.string(),
    price: priceSchema,
    compareAtPrice: priceSchema.optional(),
    rating: z.number().min(0).max(5),
    reviewCount: z.number().int().min(0),
    ingredients: z.array(productIngredientSchema),
    benefits: z.array(z.string()),
    usage: z.string(),
    origin: z.string(),
    stock: z.number().int().min(0),
    tags: z.array(z.string()),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    visual: productVisualSchema,
  })
  .openapi('Product')

export type Product = z.infer<typeof productSchema>

export const SORT_OPTIONS = ['featured', 'price-asc', 'price-desc', 'rating', 'newest'] as const
export const sortOptionSchema = z.enum(SORT_OPTIONS).openapi('SortOption')
export type SortOption = z.infer<typeof sortOptionSchema>

export const productQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    categories: z
      .union([categoryIdSchema, z.array(categoryIdSchema)])
      .optional()
      .transform((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v])),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    sort: sortOptionSchema.default('featured'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(9),
  })
  .openapi('ProductQuery')

export type ProductQuery = z.infer<typeof productQuerySchema>

/**
 * What a caller may send. Written out rather than derived with `z.input`,
 * because `z.coerce.*().default()` collapses the inferred input to `unknown`.
 */
export interface ProductQueryInput {
  search?: string
  categories?: CategoryId | CategoryId[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort?: SortOption
  page?: number
  pageSize?: number
}

export const pagedProductsSchema = paginated(productSchema, 'PagedProducts')
export type PagedProducts = z.infer<typeof pagedProductsSchema>

export const reviewSchema = z
  .object({
    id: idSchema,
    productId: idSchema,
    author: z.string(),
    location: z.string(),
    rating: z.number().int().min(1).max(5),
    date: z.string(),
    title: z.string(),
    body: z.string(),
  })
  .openapi('Review')

export const MODERATION_STATUSES = ['Pending', 'Approved', 'Rejected'] as const
export const moderationStatusSchema = z.enum(MODERATION_STATUSES).openapi('ModerationStatus')

export const adminReviewSchema = reviewSchema
  .extend({ status: moderationStatusSchema })
  .openapi('AdminReview')

export const ingredientSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    sanskritName: z.string(),
    latinName: z.string(),
    origin: z.string(),
    traditionalCategory: z.string(),
    description: z.string(),
    foundIn: z.array(z.string()),
    palette: z.object({ deep: z.string(), soft: z.string(), accent: z.string() }),
  })
  .openapi('Ingredient')

export const articleSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    excerpt: z.string(),
    readTime: z.string(),
    topic: z.string(),
    date: z.string(),
    pullQuote: z.string(),
    sections: z.array(
      z.object({ heading: z.string().optional(), paragraphs: z.array(z.string()) }),
    ),
  })
  .openapi('Article')

export const testimonialSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    city: z.string(),
    rating: z.number().int().min(1).max(5),
    quote: z.string(),
  })
  .openapi('Testimonial')

export const faqSchema = z.object({ question: z.string(), answer: z.string() }).openapi('Faq')

export const cartItemSchema = z
  .object({ productId: idSchema, qty: z.number().int().min(1).max(10) })
  .openapi('CartItem')
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({ items: z.array(cartItemSchema).max(50) }).openapi('Cart')

export const cartLineSchema = cartItemSchema
  .extend({
    name: z.string(),
    slug: z.string(),
    price: priceSchema,
    stock: z.number().int().min(0),
    visual: productVisualSchema,
  })
  .openapi('CartLine')

export const cartViewSchema = z
  .object({
    items: z.array(cartLineSchema),
    subtotal: priceSchema,
    shipping: priceSchema,
    total: priceSchema,
    freeShippingThreshold: priceSchema,
    amountToFreeShipping: priceSchema,
  })
  .openapi('CartView')

export type CartView = z.infer<typeof cartViewSchema>

export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const
export const orderStatusSchema = z.enum(ORDER_STATUSES).openapi('OrderStatus')
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Server-authoritative order lifecycle. Anything absent here is rejected. */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to)
}

export const PAYMENT_METHODS = ['upi', 'card', 'cod'] as const
export const paymentMethodSchema = z.enum(PAYMENT_METHODS).openapi('PaymentMethod')
export type PaymentMethod = z.infer<typeof paymentMethodSchema>

export const orderAddressSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(120),
    email: emailSchema,
    phone: phoneSchema,
    addressLine: z.string().trim().min(6, 'Enter your address').max(240),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postalCode: postalCodeSchema,
    country: z.string().trim().min(2).max(80).default('India'),
  })
  .openapi('OrderAddress')

export type OrderAddress = z.infer<typeof orderAddressSchema>

export const orderItemSchema = z
  .object({
    productId: idSchema,
    name: z.string(),
    slug: z.string(),
    qty: z.number().int().min(1),
    price: priceSchema,
  })
  .openapi('OrderItem')

export const orderSchema = z
  .object({
    id: idSchema,
    reference: z.string(),
    userId: idSchema.nullable(),
    items: z.array(orderItemSchema),
    subtotal: priceSchema,
    shipping: priceSchema,
    total: priceSchema,
    address: orderAddressSchema,
    paymentMethod: paymentMethodSchema,
    paymentStatus: z.enum(['pending', 'authorized', 'captured', 'failed', 'refunded']),
    paymentRef: z.string().nullable(),
    status: orderStatusSchema,
    placedAt: z.string(),
    estimatedDelivery: z.string(),
  })
  .openapi('Order')

export type Order = z.infer<typeof orderSchema>

export const placeOrderInputSchema = z
  .object({
    address: orderAddressSchema,
    paymentMethod: paymentMethodSchema,
    upiId: upiIdSchema.optional(),
    idempotencyKey: z.string().trim().min(8).max(100),
  })
  .openapi('PlaceOrderInput')

export const addressSchema = orderAddressSchema
  .omit({ email: true, country: true })
  .extend({
    id: idSchema,
    label: z.string().trim().min(1).max(40),
    isDefault: z.boolean(),
  })
  .openapi('SavedAddress')

export const addressInputSchema = addressSchema.omit({ id: true }).openapi('AddressInput')

export const ROLES = ['customer', 'admin'] as const
export const roleSchema = z.enum(ROLES).openapi('Role')
export type Role = z.infer<typeof roleSchema>

export const userSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    role: roleSchema,
    memberSince: z.string(),
  })
  .openapi('User')
export type User = z.infer<typeof userSchema>

export const customerStatusValues = ['Active', 'VIP', 'Dormant'] as const
export const customerStatusSchema = z.enum(customerStatusValues).openapi('CustomerStatus')

export const adminCustomerSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    email: z.string(),
    city: z.string(),
    orders: z.number().int().min(0),
    spent: priceSchema,
    status: customerStatusSchema,
    memberSince: z.string(),
  })
  .openapi('AdminCustomer')

export const auditLogEntrySchema = z
  .object({
    id: idSchema,
    actorId: idSchema,
    actorEmail: z.string(),
    action: z.string(),
    entity: z.string(),
    entityId: z.string(),
    meta: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string(),
  })
  .openapi('AuditLogEntry')

export type Category = z.infer<typeof categorySchema>
export type ProductIngredient = z.infer<typeof productIngredientSchema>
export type ProductVisual = z.infer<typeof productVisualSchema>
export type Review = z.infer<typeof reviewSchema>
export type AdminReview = z.infer<typeof adminReviewSchema>
export type Ingredient = z.infer<typeof ingredientSchema>
export type Article = z.infer<typeof articleSchema>
export type Testimonial = z.infer<typeof testimonialSchema>
export type Faq = z.infer<typeof faqSchema>
export type Address = z.infer<typeof addressSchema>
export type AdminCustomer = z.infer<typeof adminCustomerSchema>
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>
export type OrderItem = z.infer<typeof orderItemSchema>
