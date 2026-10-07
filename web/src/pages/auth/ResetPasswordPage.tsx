import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useResetPassword } from '@/hooks/useAuth'
import { fieldErrorList, fieldErrors } from '@/utils/errors'
import { AuthLayout, inputStyles } from './AuthLayout'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const reset = useResetPassword()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hints, setHints] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setError('Use at least 8 characters')
      setHints([])
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      setHints([])
      return
    }
    setError(null)
    setHints([])

    try {
      await reset.mutateAsync({ token, password })
      setDone(true)
    } catch (err) {
      const { message, fields } = fieldErrors(err)
      setError(message)
      setHints(fieldErrorList(fields))
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="This link works once. After you save it you will be signed out everywhere."
      footer={
        <Link to="/login/customer" className="link-underline font-semibold text-bronze-400">
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <div
          className="mt-7 rounded-2xl border border-moss-400/30 bg-moss-600/15 p-5"
          role="status"
        >
          <p className="text-sm leading-relaxed text-sage-200">Your password has been changed.</p>
          <Button
            type="button"
            variant="bronze"
            size="lg"
            magnetic
            className="mt-5 w-full"
            onClick={() => navigate('/login/customer', { replace: true })}
          >
            Continue to sign in
          </Button>
        </div>
      ) : !token ? (
        <div className="mt-7 rounded-2xl border border-clay-500/30 bg-clay-500/10 p-5" role="alert">
          <p className="text-sm leading-relaxed text-clay-400">
            This page needs a reset link. Request a new one from the{' '}
            <Link to="/forgot-password" className="link-underline font-semibold">
              forgot password
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold tracking-[0.14em] text-sage-300/70 uppercase">
              New password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputStyles}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold tracking-[0.14em] text-sage-300/70 uppercase">
              Confirm password
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className={inputStyles}
            />
          </label>

          {error && (
            <div role="alert" className="text-xs font-semibold text-clay-400">
              <p>{error}</p>
              {hints.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 font-normal">
                  {hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="bronze"
            size="lg"
            magnetic
            className="w-full"
            disabled={reset.isPending}
          >
            {reset.isPending ? 'Saving…' : 'Save new password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
