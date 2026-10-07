import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { LogoMark } from '@/components/layout/Logo'
import { useDocumentMeta } from '@/hooks'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  useDocumentMeta(`${title} — ARANYA`)
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-forest-950 px-5 py-28">
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
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <Link
          to="/"
          aria-label="Aranya — home"
          className="mx-auto mb-8 flex w-fit items-center gap-2.5 text-ivory-50"
        >
          <LogoMark className="size-7 text-bronze-400" />
          <span className="font-display text-lg font-semibold tracking-[0.32em]">ARANYA</span>
        </Link>

        <div className="rounded-[2rem] border border-ivory-50/[0.08] bg-forest-900/80 p-8 backdrop-blur-md sm:p-10">
          <p className="eyebrow text-bronze-400">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-medium text-ivory-50">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-sage-300/70">{subtitle}</p>}
          {children}
        </div>

        {footer && <p className="mt-7 text-center text-sm text-sage-300/70">{footer}</p>}
      </m.div>
    </div>
  )
}

export const inputStyles =
  'h-13 w-full rounded-xl border border-ivory-50/12 bg-ivory-50/[0.05] px-4 text-sm text-ivory-50 outline-none transition-colors placeholder:text-sage-300/35 focus:border-bronze-400/60 focus:bg-ivory-50/[0.08]'
