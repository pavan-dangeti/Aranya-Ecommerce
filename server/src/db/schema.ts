import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { CATEGORY_IDS, ORDER_STATUSES, ROLES } from '@aranya/shared'

export const roleEnum = pgEnum('role', ROLES)
export const orderStatusEnum = pgEnum('order_status', ORDER_STATUSES)
export const categoryEnum = pgEnum('category_id', CATEGORY_IDS)
export const paymentMethodEnum = pgEnum('payment_method', ['upi', 'card', 'cod'])
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
])
export const moderationStatusEnum = pgEnum('moderation_status', ['Pending', 'Approved', 'Rejected'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('customer'),
    phone: varchar('phone', { length: 24 }),
    memberSince: timestamp('member_since', { withTimezone: true }).notNull().defaultNow(),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    failedLogins: integer('failed_logins').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_lower_idx').on(sql`lower(${t.email})`)],
)

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    familyId: uuid('family_id').notNull(),
    userAgent: text('user_agent'),
    ip: varchar('ip', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    replacedById: uuid('replaced_by_id'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('refresh_token_hash_idx').on(t.tokenHash),
    index('refresh_tokens_user_idx').on(t.userId),
    index('refresh_tokens_family_idx').on(t.familyId),
  ],
)

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('password_reset_hash_idx').on(t.tokenHash)],
)

export const categories = pgTable('categories', {
  id: categoryEnum('id').primaryKey(),
  name: varchar('name', { length: 80 }).notNull(),
  tagline: varchar('tagline', { length: 200 }).notNull(),
  position: integer('position').notNull().default(0),
})

export const products = pgTable(
  'products',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    slug: varchar('slug', { length: 160 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    category: categoryEnum('category').notNull(),
    description: text('description').notNull(),
    shortDescription: varchar('short_description', { length: 300 }).notNull(),
    price: integer('price').notNull(),
    compareAtPrice: integer('compare_at_price'),
    origin: varchar('origin', { length: 160 }).notNull(),
    usage: text('usage').notNull(),
    stock: integer('stock').notNull().default(0),
    tags: text('tags').array().notNull().default([]),
    benefits: text('benefits').array().notNull().default([]),
    ingredients: jsonb('ingredients')
      .$type<Array<{ name: string; note: string }>>()
      .notNull()
      .default([]),
    visual: jsonb('visual')
      .$type<{ form: string; glass: string; liquid: string; label: string; accent: string }>()
      .notNull(),
    rating: real('rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    featured: boolean('featured').notNull().default(false),
    isNew: boolean('is_new').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('products_slug_idx').on(t.slug),
    index('products_category_idx').on(t.category),
    index('products_price_idx').on(t.price),
    index('products_rating_idx').on(t.rating),
    index('products_featured_idx').on(t.featured),
    index('products_stock_idx').on(t.stock),
  ],
)

export const ingredients = pgTable('ingredients', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  sanskritName: varchar('sanskrit_name', { length: 160 }).notNull(),
  latinName: varchar('latin_name', { length: 160 }).notNull(),
  origin: varchar('origin', { length: 160 }).notNull(),
  traditionalCategory: varchar('traditional_category', { length: 120 }).notNull(),
  description: text('description').notNull(),
  foundIn: text('found_in').array().notNull().default([]),
  palette: jsonb('palette').$type<{ deep: string; soft: string; accent: string }>().notNull(),
})

export const articles = pgTable('articles', {
  slug: varchar('slug', { length: 160 }).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  excerpt: text('excerpt').notNull(),
  readTime: varchar('read_time', { length: 40 }).notNull(),
  topic: varchar('topic', { length: 80 }).notNull(),
  date: varchar('date', { length: 40 }).notNull(),
  pullQuote: text('pull_quote').notNull(),
  sections: jsonb('sections')
    .$type<Array<{ heading?: string; paragraphs: string[] }>>()
    .notNull()
    .default([]),
  position: integer('position').notNull().default(0),
})

export const testimonials = pgTable('testimonials', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  rating: integer('rating').notNull(),
  quote: text('quote').notNull(),
  position: integer('position').notNull().default(0),
})

export const faqs = pgTable('faqs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  question: varchar('question', { length: 240 }).notNull(),
  answer: text('answer').notNull(),
  position: integer('position').notNull().default(0),
})

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: varchar('product_id', { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    author: varchar('author', { length: 120 }).notNull(),
    location: varchar('location', { length: 80 }).notNull(),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 120 }).notNull(),
    body: text('body').notNull(),
    status: moderationStatusEnum('status').notNull().default('Pending'),
    ...timestamps,
  },
  (t) => [
    index('reviews_product_idx').on(t.productId),
    index('reviews_status_idx').on(t.status),
    uniqueIndex('reviews_user_product_idx')
      .on(t.userId, t.productId)
      .where(sql`${t.userId} is not null`),
  ],
)

export const wishlists = pgTable(
  'wishlists',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
)

export const carts = pgTable('carts', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const cartItems = pgTable(
  'cart_items',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    qty: integer('qty').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
)

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 40 }).notNull(),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 24 }).notNull(),
    addressLine: varchar('address_line', { length: 240 }).notNull(),
    city: varchar('city', { length: 80 }).notNull(),
    state: varchar('state', { length: 80 }).notNull(),
    postalCode: varchar('postal_code', { length: 10 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps,
  },
  (t) => [index('addresses_user_idx').on(t.userId)],
)

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reference: varchar('reference', { length: 24 }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    status: orderStatusEnum('status').notNull().default('Pending'),
    subtotal: integer('subtotal').notNull(),
    shipping: integer('shipping').notNull(),
    total: integer('total').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    paymentRef: varchar('payment_ref', { length: 120 }),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
    address: jsonb('address')
      .$type<{
        fullName: string
        email: string
        phone: string
        addressLine: string
        city: string
        state: string
        postalCode: string
        country: string
      }>()
      .notNull(),
    estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }).notNull(),
    placedAt: timestamp('placed_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('orders_reference_idx').on(t.reference),
    uniqueIndex('orders_idempotency_idx').on(t.userId, t.idempotencyKey),
    index('orders_user_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    index('orders_placed_idx').on(t.placedAt),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    qty: integer('qty').notNull(),
    price: integer('price').notNull(),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_product_idx').on(t.productId),
  ],
)

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: varchar('product_id', { length: 64 })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: varchar('reason', { length: 60 }).notNull(),
    note: varchar('note', { length: 200 }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('inventory_product_idx').on(t.productId)],
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    actorEmail: varchar('actor_email', { length: 254 }).notNull(),
    action: varchar('action', { length: 60 }).notNull(),
    entity: varchar('entity', { length: 40 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_created_idx').on(t.createdAt),
    index('audit_entity_idx').on(t.entity, t.entityId),
  ],
)

export const userRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  cartItems: many(cartItems),
  wishlists: many(wishlists),
}))

export const productRelations = relations(products, ({ many }) => ({
  reviews: many(reviews),
  orderItems: many(orderItems),
}))

export const orderRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}))

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}))

export const addressRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}))

export const reviewRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}))

export type UserRow = typeof users.$inferSelect
export type ProductRow = typeof products.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type AddressRow = typeof addresses.$inferSelect
export type ReviewRow = typeof reviews.$inferSelect
