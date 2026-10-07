import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { m } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { validEmail } from '@/utils/validate'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { EASE_ORGANIC } from '@/utils/motion'
import { useDocumentMeta } from '@/hooks'

const inputStyles =
  'h-13 w-full rounded-xl border border-ivory-50/12 bg-forest-950/60 px-4 text-sm text-ivory-50 outline-none transition-colors placeholder:text-sage-300/30 focus:border-bronze-400/60'

export default function AdminLoginPage() {
  useDocumentMeta('Admin sign in — ARANYA')
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Capture-phase guard: a password form must never natively submit —
  // a GET fallback would leak credentials into the URL.
  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const guard = (e: SubmitEvent) => e.preventDefault()
    el.addEventListener('submit', guard)
    return () => el.removeEventListener('submit', guard)
  }, [])

  const login = useLogin()

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
      if (user.role !== 'admin') {
        setError('This is the admin sign-in. Customer accounts use the customer sign-in.')
        return
      }
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-forest-950 px-5 py-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(rgba(250,247,240,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(250,247,240,0.025)_1px,transparent_1px)] bg-[size:44px_44px]"
      />
      <div
        aria-hidden="true"
        className="absolute top-[-25%] right-[-10%] size-[40rem] rounded-full bg-[radial-gradient(circle,rgba(68,104,76,0.35),transparent_65%)]"
      />

      <m.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_ORGANIC }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/"
          aria-label="Aranya — home"
          className="mx-auto mb-9 flex w-fit items-center gap-2.5 text-ivory-50"
        >
          <LogoMark className="size-7 text-bronze-400" />
          <span className="font-display text-lg font-semibold tracking-[0.32em]">ARANYA</span>
        </Link>

        <div className="overflow-hidden rounded-3xl border border-ivory-50/[0.09] shadow-lift-lg">
          <div className="border-b border-ivory-50/[0.08] bg-forest-900 px-8 py-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-bronze-500/15 text-bronze-400">
                <ShieldCheck size={19} strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.22em] text-bronze-400/90 uppercase">
                  Operations Console
                </p>
                <h1 className="mt-0.5 font-display text-2xl font-medium text-ivory-50">
                  Admin sign in
                </h1>
              </div>
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={submit}
            noValidate
            className="space-y-4 bg-forest-900/60 p-8"
            data-testid="admin-login-form"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-sage-300/70 uppercase"
              >
                Admin email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                data-testid="admin-email"
                className={inputStyles}
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-sage-300/70 uppercase"
              >
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                data-testid="admin-password"
                className={inputStyles}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-clay-500/30 bg-clay-500/10 px-4 py-3 text-xs font-semibold text-clay-400"
                data-testid="admin-login-error"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="bronze"
              size="lg"
              className="w-full"
              disabled={busy}
              data-testid="admin-login-submit"
            >
              {busy ? 'Verifying…' : 'Admin login'}
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-sage-300/70">
              Administrator accounts are provisioned server-side. Every admin route re-checks your
              role and writes an audit entry.
            </p>
          </form>
        </div>

        <p className="mt-7 text-center text-sm text-sage-300/70">
          Looking to shop?{' '}
          <Link to="/login/customer" className="link-underline font-semibold text-bronze-400">
            Customer sign in
          </Link>
        </p>
      </m.div>
    </div>
  )
}
