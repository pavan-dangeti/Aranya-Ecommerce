import { z } from './z.js'

export * from './constants.js'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160)
}

export const pricingSchema = z
  .object({
    subtotal: z.number().int().min(0),
    shipping: z.number().int().min(0),
    total: z.number().int().min(0),
    freeShippingThreshold: z.number().int().positive(),
    amountToFreeShipping: z.number().int().min(0),
  })
  .openapi('Pricing')
