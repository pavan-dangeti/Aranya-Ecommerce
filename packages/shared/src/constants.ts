// Zod-free so the browser bundle can import these without the schema layer.
export const FREE_SHIPPING_THRESHOLD = 999
export const SHIPPING_FEE = 79
export const DELIVERY_DAYS = 5
export const CRITICAL_STOCK_THRESHOLD = 5
export const LOW_STOCK_THRESHOLD = 10
export const MAX_QTY_PER_LINE = 10

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  return SHIPPING_FEE
}

export function estimatedDeliveryFrom(from: Date = new Date()): string {
  const eta = new Date(from)
  eta.setDate(eta.getDate() + DELIVERY_DAYS)
  return eta.toISOString()
}
