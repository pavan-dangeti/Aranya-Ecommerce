import { z } from './z.js'

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      requestId: z.string(),
      details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    }),
  })
  .openapi('ErrorResponse')

export type ErrorResponse = z.infer<typeof errorResponseSchema>

export const csrfTokenResponseSchema = z
  .object({ token: z.string().min(8) })
  .openapi('CsrfTokenResponse')

export const idSchema = z.string().min(1).max(64)
export const emailSchema = z.email('Enter a valid email address').max(254)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+?91[- ]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number')
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/\d/, 'Include a number')
export const upiIdSchema = z
  .string()
  .trim()
  .regex(/^[\w.-]{2,}@[a-zA-Z]{2,}$/, 'Enter a valid UPI ID (e.g. name@bank)')
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code')

export const priceSchema = z.number().int().min(0)

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type Pagination = z.infer<typeof paginationSchema>

export function paginated<T extends z.ZodType>(item: T, name: string) {
  return z
    .object({
      items: z.array(item),
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1),
      totalPages: z.number().int().min(1),
    })
    .openapi(name)
}

export function pageMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
