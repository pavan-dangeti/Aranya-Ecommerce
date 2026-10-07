import type { PaymentMethod } from '@aranya/shared'

export interface ChargeRequest {
  orderReference: string
  orderId: string
  amount: number
  currency: 'INR'
  method: PaymentMethod
  upiId?: string
  customerEmail: string
}

export type ChargeResult =
  | { ok: true; status: 'authorized' | 'captured'; providerRef: string }
  | { ok: false; code: string; message: string }

export interface RefundRequest {
  providerRef: string
  amount: number
}

export interface PaymentProvider {
  readonly name: string
  charge(req: ChargeRequest): Promise<ChargeResult>
  refund(req: RefundRequest): Promise<ChargeResult>
  /** Verifies a webhook signature. Throws when the signature does not match. */
  verifyWebhook?(rawBody: string, signature: string): { event: string; payload: unknown }
}
