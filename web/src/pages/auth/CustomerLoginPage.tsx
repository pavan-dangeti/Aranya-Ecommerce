import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useLogin } from '@/hooks/useAuth'
import { validEmail } from '@/utils/validate'
import { AuthLayout, inputStyles } from './AuthLayout'
import { Button } from '@/components/ui/Button'

export default function CustomerLoginPage() {
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const guard = (e: SubmitEvent) => e.preventDefault()
    el.addEventListener('submit', guard)
    return () => el.removeEventListener('submit', guard)
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    const emailError = validEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const user = await login.mutateAsync({ email, password })
      if (user.role !== 'customer') {
        setError('This account is an administrator. Use the admin sign-in instead.')
        return
      }
      navigate(from !== '/' ? from : '/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Customer sign in"
      title="Welcome back"
      subtitle="Sign in to reach your orders, wishlist and saved rituals."
      footer={
        <>
          New to Aranya?{' '}
          <Link
            to="/register/customer"
            className="link-underline font-semibold text-bronze-400"
            data-testid="link-register"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="mt-7 space-y-4"
        data-testid="customer-login-form"
      >
        <div>
          <label
            htmlFor="cust-email"
            className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-sage-300/70 uppercase"
          >
            Email
          </label>
          <input
            id="cust-email"
            name="email"
            type="email"
            autoComplete="email"
            data-testid="customer-email"
            className={inputStyles}
          />
        </div>
        <div>
          <label
            htmlFor="cust-password"
            className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-sage-300/70 uppercase"
          >
            Password
          </label>
          <input
            id="cust-password"
            name="password"
            type="password"
            autoComplete="current-password"
            data-testid="customer-password"
            className={inputStyles}
          />
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            to="/forgot-password"
            className="link-underline text-xs font-semibold text-sage-300/70"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-clay-500/30 bg-clay-500/10 px-4 py-3 text-xs font-semibold text-clay-400"
            data-testid="login-error"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="bronze"
          size="lg"
          magnetic
          className="w-full"
          disabled={busy}
          data-testid="customer-login-submit"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <Link
        to="/products"
        className="mt-6 block rounded-xl border border-ivory-50/[0.08] py-3.5 text-center text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase transition-colors hover:border-ivory-50/25 hover:text-ivory-50"
        data-testid="continue-as-guest"
      >
        Continue as guest
      </Link>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-sage-300/70">
        Signing in keeps your cart, wishlist and addresses in sync across devices.
      </p>
    </AuthLayout>
  )
}
