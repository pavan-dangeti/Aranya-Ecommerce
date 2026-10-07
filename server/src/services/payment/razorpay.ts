import { createHmac, timingSafeEqual } from 'node:crypto'
import { badRequest } from '../../http/errors.js'
import type { ChargeRequest, ChargeResult, PaymentProvider, RefundRequest } from './provider.js'

const API = 'https://api.razorpay.com/v1'

interface RazorpayOrder {
  id: string
  amount: number
  currency: string
  status: string
}

interface RazorpayPayment {
  razorpay_payment_id?: string
  razorpay_order_id?: string
  error?: { code?: string; description?: string }
}

/**
 * Razorpay test-mode adapter. Enabled only when RAZORPAY_KEY_ID/SECRET are set.
 * Card data never reaches this server — only an order id plus a payment id.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  readonly name = 'razorpay'

  private readonly auth: string

  private readonly webhookSecret: string | undefined

  constructor(keyId: string, keySecret: string, webhookSecret?: string) {
    this.auth = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
    this.webhookSecret = webhookSecret
  }

  private async call<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: this.auth,
        'Content-Type': 'application/json',
      },
    })

    const body = (await res.json().catch(() => ({}))) as T & RazorpayPayment
    if (!res.ok) {
      const message = body.error?.description ?? `Razorpay request failed with ${res.status}`
      const code = body.error?.code ?? 'provider_error'
      return Promise.reject(new Error(`${code}: ${message}`))
    }
    return body
  }

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    try {
      const order = await this.call<RazorpayOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          amount: req.amount * 100,
          currency: req.currency,
          receipt: req.orderReference,
          notes: { orderId: req.orderId, method: req.method },
        }),
      })

      if (req.method === 'cod') {
        return { ok: true, status: 'authorized', providerRef: order.id }
      }

      return { ok: true, status: 'authorized', providerRef: order.id }
    } catch (err) {
      return {
        ok: false,
        code: 'provider_error',
        message: err instanceof Error ? err.message : 'Payment failed',
      }
    }
  }

  async refund(req: RefundRequest): Promise<ChargeResult> {
    try {
      const refund = await this.call<{ id: string }>(`/payments/${req.providerRef}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount: req.amount * 100 }),
      })
      return { ok: true, status: 'captured', providerRef: refund.id }
    } catch (err) {
      return {
        ok: false,
        code: 'refund_failed',
        message: err instanceof Error ? err.message : 'Refund failed',
      }
    }
  }

  verifyWebhook(rawBody: string, signature: string): { event: string; payload: unknown } {
    if (!this.webhookSecret)
      throw badRequest('Webhook secret is not configured', 'webhook_unconfigured')

    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex')
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(signature, 'utf8')
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw badRequest('Webhook signature mismatch', 'webhook_invalid')
    }

    const parsed = JSON.parse(rawBody) as { event?: string }
    return { event: parsed.event ?? 'unknown', payload: JSON.parse(rawBody) }
  }
}
