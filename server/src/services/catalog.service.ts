import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  articles,
  categories,
  faqs,
  ingredients,
  products,
  reviews,
  testimonials,
  type ProductRow,
} from '../db/schema.js'
import { notFound } from '../http/errors.js'
import {
  pageMeta,
  productSchema,
  type Product,
  type ProductQuery,
  type Review,
} from '@aranya/shared'

export type ProductView = Product

/** Every read goes through the shared schema so the API can never drift from the contract. */
export function toProductView(row: ProductRow): ProductView {
  return productSchema.parse({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    shortDescription: row.shortDescription,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    ingredients: row.ingredients,
    benefits: row.benefits,
    usage: row.usage,
    origin: row.origin,
    stock: row.stock,
    tags: row.tags,
    featured: row.featured || undefined,
    isNew: row.isNew || undefined,
    visual: row.visual,
  })
}

export type ProductReview = Omit<Review, 'date'> & { date: string }

function productFilters(query: ProductQuery): SQL | undefined {
  const conditions: SQL[] = []

  if (query.search) {
    const term = `%${query.search.toLowerCase()}%`
    conditions.push(
      or(
        ilike(products.name, term),
        ilike(products.shortDescription, term),
        ilike(products.origin, term),
        sql`array_to_string(${products.tags}, ' ') ilike ${term}`,
        // ingredients is a jsonb array of { name, note }; the text form covers it.
        sql`${products.ingredients}::text ilike ${term}`,
        // `category` is an enum, so it has to be cast before a text match.
        sql`${products.category}::text ilike ${term}`,
      )!,
    )
  }

  if (query.categories?.length) conditions.push(inArray(products.category, query.categories))
  if (query.minPrice != null) conditions.push(sql`${products.price} >= ${query.minPrice}`)
  if (query.maxPrice != null) conditions.push(sql`${products.price} <= ${query.maxPrice}`)
  if (query.minRating != null) conditions.push(sql`${products.rating} >= ${query.minRating}`)

  return conditions.length > 0 ? and(...conditions) : undefined
}

const SORTS = {
  featured: [desc(products.featured), desc(products.rating), asc(products.name)],
  'price-asc': [asc(products.price)],
  'price-desc': [desc(products.price)],
  rating: [desc(products.rating), desc(products.reviewCount)],
  newest: [desc(products.isNew), desc(products.createdAt)],
} as const satisfies Record<ProductQuery['sort'], SQL[]>

export async function queryProducts(query: ProductQuery) {
  const where = productFilters(query)
  const orderBy = SORTS[query.sort]

  const rows = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderBy)
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize)

  const counted = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where)

  return {
    items: rows.map(toProductView),
    ...pageMeta(query.page, query.pageSize, Number(counted[0]?.count ?? 0)),
  }
}

export async function productBySlug(slug: string): Promise<ProductView> {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
  const row = rows[0]
  if (!row) throw notFound('Product not found', 'product_not_found')
  return toProductView(row)
}

export async function productById(id: string): Promise<ProductView> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1)
  const row = rows[0]
  if (!row) throw notFound('Product not found', 'product_not_found')
  return toProductView(row)
}

export async function featuredProducts(limit = 6): Promise<ProductView[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(desc(products.rating))
    .limit(limit)
  const fallback = rows.length > 0 ? rows : await db.select().from(products).limit(limit)
  return fallback.map(toProductView)
}

export async function relatedProducts(slug: string, limit = 4): Promise<ProductView[]> {
  const current = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
  if (!current[0]) return []

  const rows = await db
    .select()
    .from(products)
    .where(sql`${products.id} <> ${current[0].id}`)
    .orderBy(
      sql`case when ${products.category} = ${current[0].category} then 0 else 1 end`,
      desc(products.rating),
    )
    .limit(limit)

  return rows.map(toProductView)
}

export async function allCategories() {
  return db.select().from(categories).orderBy(asc(categories.position))
}

export async function allIngredients() {
  return db.select().from(ingredients)
}

export async function allArticles() {
  return db.select().from(articles).orderBy(asc(articles.position))
}

export async function articleBySlug(slug: string) {
  const rows = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1)
  if (!rows[0]) throw notFound('Article not found', 'article_not_found')
  return rows[0]
}

export async function allTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.position))
}

export async function allFaqs() {
  return db.select().from(faqs).orderBy(asc(faqs.position))
}

export async function approvedReviewsForProduct(productId: string): Promise<ProductReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      author: reviews.author,
      location: reviews.location,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, 'Approved')))
    .orderBy(desc(reviews.createdAt))

  return rows.map((r) => ({ ...r, date: r.createdAt.toISOString() }))
}

/** Recomputes the denormalised rating/reviewCount shown in the catalog. */
export async function refreshProductRating(productId: string): Promise<void> {
  await db.execute(sql`
    update products p
    set rating = coalesce(agg.avg_rating, 0),
        review_count = coalesce(agg.cnt, 0)
    from (
      select round(avg(rating)::numeric, 1) as avg_rating, count(*)::int as cnt
      from reviews
      where product_id = ${productId} and status = 'Approved'
    ) agg
    where p.id = ${productId}
  `)
}
