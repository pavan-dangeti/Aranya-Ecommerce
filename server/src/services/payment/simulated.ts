import { createHash, randomUUID } from 'node:crypto'
import type { ChargeRequest, ChargeResult, PaymentProvider, RefundRequest } from './provider.js'

/**
 * Test-mode stand-in for a real gateway. Deterministic failures let the client
 * exercise the error paths without a live provider account.
 */
export class SimulatedPaymentProvider implements PaymentProvider {
  readonly name = 'simulated'

  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (req.amount <= 0)
      return { ok: false, code: 'invalid_amount', message: 'Charge amount must be positive' }

    if (req.method === 'card' && req.amount % 1000 === 0) {
      return { ok: false, code: 'card_declined', message: 'The card was declined by the issuer' }
    }

    if (req.method === 'upi' && req.upiId && req.upiId.endsWith('@fail')) {
      return { ok: false, code: 'upi_failed', message: 'The UPI payment could not be completed' }
    }

    const providerRef = `sim_${req.method}_${createHash('sha256')
      .update(req.orderReference)
      .digest('hex')
      .slice(0, 16)}`

    return { ok: true, status: 'captured', providerRef }
  }

  async refund(_req: RefundRequest): Promise<ChargeResult> {
    return { ok: true, status: 'captured', providerRef: `rfnd_${randomUUID().slice(0, 8)}` }
  }
}
