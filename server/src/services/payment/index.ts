import { env } from '../../env.js'
import { RazorpayPaymentProvider } from './razorpay.js'
import { SimulatedPaymentProvider } from './simulated.js'
import type { PaymentProvider } from './provider.js'

let provider: PaymentProvider | null = null

export function paymentProvider(): PaymentProvider {
  if (provider) return provider

  if (env.PAYMENT_PROVIDER === 'razorpay') {
    provider = new RazorpayPaymentProvider(
      env.RAZORPAY_KEY_ID!,
      env.RAZORPAY_KEY_SECRET!,
      env.RAZORPAY_WEBHOOK_SECRET,
    )
  } else {
    provider = new SimulatedPaymentProvider()
  }

  return provider
}
