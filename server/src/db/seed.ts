import { randomBytes } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { db, closePool } from './client.js'
import { env } from '../env.js'
import {
  addresses,
  articles,
  cartItems,
  categories,
  faqs,
  ingredients,
  inventoryMovements,
  orderItems,
  orders,
  products,
  reviews,
  testimonials,
  users,
  wishlists,
} from './schema.js'
import { logger } from '../logger.js'
import { hashPassword } from '../lib/password.js'
import { shippingFor, estimatedDeliveryFrom } from '@aranya/shared'
import {
  articles as articleRows,
  categories as categoryRows,
  demoCustomers,
  demoOrderSpecs,
  demoReviewSpecs,
  faqs as faqRows,
  ingredients as ingredientRows,
  products as productRows,
  reviews as seededReviewRows,
  testimonials as testimonialRows,
} from '@aranya/data'

const CUSTOMER_STATE = [
  'Karnataka',
  'Tamil Nadu',
  'Maharashtra',
  'Haryana',
  'Goa',
  'Rajasthan',
] as const

function customerAddress(index: number) {
  const c = demoCustomers[index % demoCustomers.length]!
  return {
    fullName: c.name,
    email: c.email,
    phone: `98${String(10000000 + index * 1234567).slice(0, 8)}`,
    addressLine: `${12 + index} Grove Street, ${c.city}`,
    city: c.city,
    state: CUSTOMER_STATE[index % CUSTOMER_STATE.length]!,
    postalCode: `5600${String(10 + (index % 40)).padStart(2, '0')}`,
    country: 'India',
  }
}

function referenceFor(index: number) {
  const CODES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let n = 0; n < 6; n++) suffix += CODES[(index * 7 + n * 13 + 11) % CODES.length]!
  return `ARN-${suffix}`
}

export async function runSeed() {
  await truncateAll()

  await db
    .insert(categories)
    .values(
      categoryRows.map((c, i) => ({ id: c.id, name: c.name, tagline: c.tagline, position: i })),
    )

  await db.insert(products).values(
    productRows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      description: p.description,
      shortDescription: p.shortDescription,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      origin: p.origin,
      usage: p.usage,
      stock: p.stock,
      tags: p.tags,
      benefits: p.benefits,
      ingredients: p.ingredients,
      visual: p.visual,
      rating: p.rating,
      reviewCount: p.reviewCount,
      featured: p.featured ?? false,
      isNew: p.isNew ?? false,
    })),
  )

  await db.insert(ingredients).values(ingredientRows)

  await db.insert(articles).values(
    articleRows.map((a, i) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      readTime: a.readTime,
      topic: a.topic,
      date: a.date,
      pullQuote: a.pullQuote,
      sections: a.sections,
      position: i,
    })),
  )

  await db.insert(testimonials).values(testimonialRows.map((t, i) => ({ ...t, position: i })))

  await db.insert(faqs).values(
    faqRows.map((f, i) => ({
      id: `faq-${String(i + 1).padStart(2, '0')}`,
      question: f.question,
      answer: f.answer,
      position: i,
    })),
  )

  // Without SEED_DEMO_PASSWORD the demo customers get an unguessable password,
  // so a seeded production database has no shared credential.
  const demoHash = await hashPassword(
    env.SEED_DEMO_PASSWORD ?? randomBytes(24).toString('base64url'),
  )

  const insertedUsers = await db
    .insert(users)
    .values(
      demoCustomers.map((c) => ({
        name: c.name,
        email: c.email,
        passwordHash: demoHash,
        role: 'customer' as const,
        memberSince: new Date(c.memberSince),
      })),
    )
    .returning({ id: users.id, email: users.email })

  const userIdByEmail = new Map(insertedUsers.map((u) => [u.email, u.id]))

  for (const [index, spec] of demoOrderSpecs.entries()) {
    const customer = demoCustomers[spec.customer]!
    const userId = userIdByEmail.get(customer.email)
    if (!userId) throw new Error(`seed: no user for ${customer.email}`)

    const lines = spec.items.flatMap(([productId, qty]) => {
      const product = productRows.find((p) => p.id === productId)
      return product
        ? [{ productId, name: product.name, slug: product.slug, qty, price: product.price }]
        : []
    })
    if (lines.length === 0) continue

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
    const shipping = shippingFor(subtotal)
    const placed = new Date()
    placed.setDate(placed.getDate() - spec.daysAgo)

    const [order] = await db
      .insert(orders)
      .values({
        reference: referenceFor(index + 20),
        userId,
        status: spec.status,
        subtotal,
        shipping,
        total: subtotal + shipping,
        paymentMethod: spec.payment,
        paymentStatus: spec.status === 'Cancelled' ? 'refunded' : 'captured',
        paymentRef: `seed_${spec.payment}_${index}`,
        idempotencyKey: `seed-${index}`,
        address: customerAddress(spec.customer),
        estimatedDelivery: new Date(estimatedDeliveryFrom(placed)),
        placedAt: placed,
      })
      .returning({ id: orders.id, reference: orders.reference })

    if (!order) continue

    await db.insert(orderItems).values(lines.map((l) => ({ orderId: order.id, ...l })))

    for (const line of lines) {
      await db.insert(inventoryMovements).values({
        productId: line.productId,
        delta: -line.qty,
        reason: 'order_placed',
        note: order.reference,
        actorId: userId,
        orderId: order.id,
        createdAt: placed,
      })
    }
  }

  await db.insert(reviews).values([
    ...seededReviewRows.map((r) => ({
      productId: r.productId,
      author: r.author,
      location: r.location,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: 'Approved' as const,
      createdAt: new Date(r.date),
    })),
    ...demoReviewSpecs.map((spec) => {
      const customer = demoCustomers.find((c) => c.email === spec.author)
      return {
        productId: spec.productId,
        userId: customer ? userIdByEmail.get(customer.email) : null,
        author: customer?.name ?? spec.author,
        location: spec.location,
        rating: spec.rating,
        title: spec.title,
        body: spec.body,
        status: spec.status as 'Pending' | 'Approved' | 'Rejected',
        createdAt: new Date(Date.now() - spec.daysAgo * 86_400_000),
      }
    }),
  ])

  await refreshAllRatings()

  const [wishlistUser] = insertedUsers
  if (wishlistUser) {
    await db
      .insert(wishlists)
      .values(productRows.slice(0, 3).map((p) => ({ userId: wishlistUser.id, productId: p.id })))
    await db
      .insert(cartItems)
      .values(
        productRows
          .slice(3, 5)
          .map((p, i) => ({ userId: wishlistUser.id, productId: p.id, qty: i + 1 })),
      )
    await db.insert(addresses).values([
      {
        userId: wishlistUser.id,
        label: 'Home',
        fullName: 'Ishita Roy',
        phone: '9812345670',
        addressLine: '42 Jasmine Lane, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        isDefault: true,
      },
    ])
  }

  const counts = await db.execute<{
    products: number
    users: number
    orders: number
    reviews: number
    articles: number
  }>(sql`
    select
      (select count(*)::int from products) as products,
      (select count(*)::int from users) as users,
      (select count(*)::int from orders) as orders,
      (select count(*)::int from reviews) as reviews,
      (select count(*)::int from articles) as articles
  `)

  return (counts.rows ?? counts)[0]
}

export async function refreshAllRatings() {
  await db.execute(sql`
    update products p
    set rating = coalesce(agg.avg_rating, 0),
        review_count = coalesce(agg.cnt, 0)
    from (
      select product_id,
             round(avg(rating)::numeric, 1) as avg_rating,
             count(*)::int as cnt
      from reviews
      where status = 'Approved'
      group by product_id
    ) agg
    where p.id = agg.product_id
  `)
}

export async function truncateAll() {
  await db.execute(sql`
    truncate table
      audit_logs, inventory_movements, order_items, orders, cart_items, carts,
      wishlists, addresses, reviews, products, ingredients, articles, testimonials,
      faqs, categories, password_reset_tokens, refresh_tokens, users
    restart identity cascade
  `)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const counts = await runSeed()
    const { ensureSeedAdmin } = await import('../services/auth.service.js')
    logger.info({ ...counts, adminCreated: await ensureSeedAdmin() }, 'database seeded')
    await closePool()
    process.exit(0)
  } catch (err) {
    logger.error({ err }, 'seed failed')
    await closePool().catch(() => undefined)
    process.exit(1)
  }
}
