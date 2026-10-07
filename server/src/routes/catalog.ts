import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import {
  articleSchema,
  categorySchema,
  errorResponseSchema,
  faqSchema,
  ingredientSchema,
  pagedProductsSchema,
  productQuerySchema,
  productSchema,
  testimonialSchema,
} from '@aranya/shared'
import * as catalog from '../services/catalog.service.js'
import type { AppEnv } from '../http/context.js'

const notFound = {
  404: {
    description: 'Not found',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
} as const

const productsRoute = createRoute({
  method: 'get',
  path: '/api/products',
  tags: ['catalog'],
  summary: 'Search, filter, sort and paginate the catalog',
  request: { query: productQuerySchema },
  responses: {
    200: {
      description: 'A page of products',
      content: { 'application/json': { schema: pagedProductsSchema } },
    },
    422: {
      description: 'Invalid query',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
})

const featuredRoute = createRoute({
  method: 'get',
  path: '/api/products/featured',
  tags: ['catalog'],
  summary: 'Featured products for the home page',
  request: { query: z.object({ limit: z.coerce.number().int().min(1).max(24).default(6) }) },
  responses: {
    200: {
      description: 'Featured products',
      content: { 'application/json': { schema: z.array(productSchema) } },
    },
  },
})

const productRoute = createRoute({
  method: 'get',
  path: '/api/products/{slug}',
  tags: ['catalog'],
  summary: 'One product by slug',
  request: { params: z.object({ slug: z.string().min(1) }) },
  responses: {
    200: { description: 'The product', content: { 'application/json': { schema: productSchema } } },
    ...notFound,
  },
})

const relatedRoute = createRoute({
  method: 'get',
  path: '/api/products/{slug}/related',
  tags: ['catalog'],
  summary: 'Related products',
  request: {
    params: z.object({ slug: z.string().min(1) }),
    query: z.object({ limit: z.coerce.number().int().min(1).max(12).default(4) }),
  },
  responses: {
    200: {
      description: 'Related products',
      content: { 'application/json': { schema: z.array(productSchema) } },
    },
  },
})

const categoriesRoute = createRoute({
  method: 'get',
  path: '/api/categories',
  tags: ['catalog'],
  summary: 'All categories',
  responses: {
    200: {
      description: 'Categories',
      content: { 'application/json': { schema: z.array(categorySchema) } },
    },
  },
})

const ingredientsRoute = createRoute({
  method: 'get',
  path: '/api/ingredients',
  tags: ['catalog'],
  summary: 'Botanical index',
  responses: {
    200: {
      description: 'Ingredients',
      content: { 'application/json': { schema: z.array(ingredientSchema) } },
    },
  },
})

const articlesRoute = createRoute({
  method: 'get',
  path: '/api/articles',
  tags: ['catalog'],
  summary: 'Journal index',
  responses: {
    200: {
      description: 'Articles',
      content: { 'application/json': { schema: z.array(articleSchema) } },
    },
  },
})

const articleRoute = createRoute({
  method: 'get',
  path: '/api/articles/{slug}',
  tags: ['catalog'],
  summary: 'One journal article',
  request: { params: z.object({ slug: z.string().min(1) }) },
  responses: {
    200: { description: 'The article', content: { 'application/json': { schema: articleSchema } } },
    ...notFound,
  },
})

const testimonialsRoute = createRoute({
  method: 'get',
  path: '/api/testimonials',
  tags: ['catalog'],
  summary: 'Customer testimonials',
  responses: {
    200: {
      description: 'Testimonials',
      content: { 'application/json': { schema: z.array(testimonialSchema) } },
    },
  },
})

const faqsRoute = createRoute({
  method: 'get',
  path: '/api/faqs',
  tags: ['catalog'],
  summary: 'Support FAQs',
  responses: {
    200: { description: 'FAQs', content: { 'application/json': { schema: z.array(faqSchema) } } },
  },
})

export function catalogRoutes(app: OpenAPIHono<AppEnv>) {
  app.openapi(productsRoute, async (c) =>
    c.json(await catalog.queryProducts(c.req.valid('query')), 200),
  )

  app.openapi(featuredRoute, async (c) =>
    c.json(await catalog.featuredProducts(c.req.valid('query').limit), 200),
  )

  app.openapi(productRoute, async (c) =>
    c.json(await catalog.productBySlug(c.req.param('slug')), 200),
  )

  app.openapi(relatedRoute, async (c) =>
    c.json(await catalog.relatedProducts(c.req.param('slug'), c.req.valid('query').limit), 200),
  )

  app.openapi(categoriesRoute, async (c) => c.json(await catalog.allCategories(), 200))
  app.openapi(ingredientsRoute, async (c) => c.json(await catalog.allIngredients(), 200))
  app.openapi(articlesRoute, async (c) => c.json(await catalog.allArticles(), 200))
  app.openapi(articleRoute, async (c) =>
    c.json(await catalog.articleBySlug(c.req.param('slug')), 200),
  )
  app.openapi(testimonialsRoute, async (c) => c.json(await catalog.allTestimonials(), 200))
  app.openapi(faqsRoute, async (c) => c.json(await catalog.allFaqs(), 200))
}
