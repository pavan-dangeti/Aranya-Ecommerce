import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { logger } from '../logger.js'
import type { ErrorResponse } from '@aranya/shared'

export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Array<{ path: string; message: string }>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message: string, code = 'bad_request') =>
  new AppError(400, code, message)
export const unauthorized = (message = 'Sign in to continue', code = 'unauthorized') =>
  new AppError(401, code, message)
export const forbidden = (message = 'You do not have access to this', code = 'forbidden') =>
  new AppError(403, code, message)
export const notFound = (message = 'Not found', code = 'not_found') =>
  new AppError(404, code, message)
export const conflict = (message: string, code = 'conflict') => new AppError(409, code, message)
export const tooManyRequests = (message = 'Too many requests, try again shortly') =>
  new AppError(429, 'rate_limited', message)

function requestIdOf(c: Context): string {
  return c.get('requestId') ?? 'unknown'
}

function errorBody(
  c: Context,
  code: string,
  message: string,
  details?: Array<{ path: string; message: string }>,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      requestId: requestIdOf(c),
      ...(details && details.length > 0 ? { details } : {}),
    },
  }
}

export function notFoundHandler(c: Context) {
  return c.json(
    errorBody(c, 'not_found', `No route for ${c.req.method} ${new URL(c.req.url).pathname}`),
    404,
  )
}

export function onError(err: Error, c: Context) {
  const requestId = requestIdOf(c)

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, requestId }, 'request failed')
    return c.json(errorBody(c, err.code, err.message, err.details), err.status as 404)
  }

  if (err instanceof ZodError) {
    return c.json(
      errorBody(c, 'validation_failed', 'Some fields need attention', zodDetails(err)),
      422,
    )
  }

  if (err instanceof HTTPException) {
    const code =
      err.status === 404 ? 'not_found' : err.status === 401 ? 'unauthorized' : 'http_error'
    const message = err.status === 404 ? 'Not found' : err.message || 'Request failed'
    return c.json(errorBody(c, code, message), err.status as 404)
  }

  logger.error({ err, requestId, path: c.req.path, method: c.req.method }, 'unhandled error')
  return c.json(
    errorBody(c, 'internal_error', 'Something went wrong on our side. Please try again.'),
    500,
  )
}

function zodDetails(err: ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((i) => ({
    path: i.path.map(String).join('.') || '_',
    message: i.message,
  }))
}
