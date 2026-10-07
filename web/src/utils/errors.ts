import { ApiError } from '@/lib/api'

/**
 * Turns anything thrown by the API client into a headline message plus
 * per-field messages, so forms can show the server's own validation hints
 * instead of a generic failure.
 */
export function fieldErrors(err: unknown): {
  message: string
  fields: Record<string, string[]>
} {
  if (err instanceof ApiError) {
    const fields: Record<string, string[]> = {}
    for (const detail of err.details ?? []) {
      ;(fields[detail.path] ??= []).push(detail.message)
    }
    return { message: err.message, fields }
  }

  return {
    message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    fields: {},
  }
}

/** One line per field, for rendering under a single error slot. */
export function fieldErrorList(fields: Record<string, string[]>): string[] {
  return Object.entries(fields).flatMap(([path, messages]) =>
    messages.map((message) => (path ? `${path}: ${message}` : message)),
  )
}
