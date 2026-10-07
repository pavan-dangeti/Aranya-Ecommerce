import { Link, useLocation } from 'react-router'
import { m } from 'framer-motion'
import { ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react'
import { LogoMark } from '@/components/layout/Logo'
import { useDocumentMeta } from '@/hooks'
import { EASE_ORGANIC } from '@/utils/motion'
import { useAuth } from '@/hooks/useAuth'

const OPTIONS = [
  {
    to: '/login/customer',
    icon: ShoppingBag,
    title: 'Customer',
    body: 'Shop products, manage your wishlist and orders.',
    cta: 'Continue to customer sign in',
    tone: 'border-ivory-50/[0.09] hover:border-bronze-500/50',
  },
  {
    to: '/login/admin',
    icon: ShieldCheck,
    title: 'Admin',
    body: 'Manage products, orders, inventory and customers.',
    cta: 'Continue to admin sign in',
    tone: 'border-ivory-50/[0.09] hover:border-moss-400/60',
  },
]

export default function AuthChooserPage() {
  const { data: user } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  useDocumentMeta('Sign in — ARANYA')

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-forest-950 px-5 py-24">
      <div
        aria-hidden="true"
        className="absolute top-[-20%] left-[-10%] size-[42rem] rounded-full bg-[radial-gradient(circle,#14291e_0%,transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-15%] bottom-[-25%] size-[46rem] rounded-full bg-[radial-gradient(circle,rgba(194,154,100,0.09),transparent_65%)]"
      />

      <m.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_ORGANIC }}
        className="relative w-full max-w-2xl"
      >
        <Link
          to="/"
          aria-label="Aranya — home"
          className="mx-auto mb-9 flex w-fit items-center gap-2.5 text-ivory-50"
        >
          <LogoMark className="size-7 text-bronze-400" />
          <span className="font-display text-lg font-semibold tracking-[0.32em]">ARANYA</span>
        </Link>

        <div className="text-center">
          <h1 className="font-display text-4xl leading-tight font-medium text-balance text-ivory-50 sm:text-5xl">
            Welcome to your <em className="font-light text-bronze-300 italic">wellness journey.</em>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sage-300/70">
            Choose how you would like to continue.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2" data-testid="auth-chooser">
          {OPTIONS.map((option, i) => (
            <m.div
              key={option.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.6, ease: EASE_ORGANIC }}
            >
              <Link
                to={option.to}
                state={option.title === 'Customer' && from ? { from } : undefined}
                className={`group flex h-full flex-col rounded-3xl border bg-forest-900/70 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${option.tone}`}
                data-testid={`choose-${option.title.toLowerCase()}`}
              >
                <span className="grid size-12 place-items-center rounded-full bg-bronze-500/12 text-bronze-400 transition-colors group-hover:bg-bronze-500/20">
                  <option.icon size={21} strokeWidth={1.6} />
                </span>
                <h2 className="mt-5 font-display text-2xl font-medium text-ivory-50">
                  {option.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-sage-300/70">
                  {option.body}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-bronze-400 uppercase">
                  {option.cta}
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </m.div>
          ))}
        </div>

        {user && (
          <p className="mt-8 text-center text-xs text-sage-300/70">
            You are signed in as <strong className="text-sage-200">{user.name}</strong> ({user.role}
            ).{' '}
            <Link
              to={user.role === 'admin' ? '/admin' : '/profile'}
              className="link-underline font-semibold text-bronze-400"
            >
              Continue to your {user.role === 'admin' ? 'console' : 'account'}
            </Link>
          </p>
        )}
      </m.div>
    </div>
  )
}
