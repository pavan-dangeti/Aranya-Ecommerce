import { useState } from 'react'
import { Link } from 'react-router'
import { useForgotPassword } from '@/hooks/useAuth'
import { validEmail } from '@/utils/validate'
import { AuthLayout, inputStyles } from './AuthLayout'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const forgot = useForgotPassword()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailError = validEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setError(null)

    try {
      await forgot.mutateAsync(email)
    } catch {
      setError('Could not reach us just now. Please try again shortly.')
      return
    }

    // The server answers identically for known and unknown addresses, so the
    // same confirmation is shown either way.
    setSent(true)
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we would send reset instructions — in a live deployment."
      footer={
        <Link to="/login/customer" className="link-underline font-semibold text-bronze-400">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div
          className="mt-7 rounded-2xl border border-moss-400/30 bg-moss-600/15 p-5"
          role="status"
        >
          <p className="text-sm leading-relaxed text-sage-200">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. The link
            expires in one hour.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-7 space-y-4">
          <div>
            <label
              htmlFor="fp-email"
              className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-sage-300/70 uppercase"
            >
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error)}
              className={inputStyles}
            />
            {error && (
              <p role="alert" className="mt-1.5 text-xs font-semibold text-clay-400">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" variant="bronze" size="lg" magnetic className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
