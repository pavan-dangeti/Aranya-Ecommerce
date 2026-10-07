import { Link } from 'react-router'
import { cn } from '@/utils/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('size-8', className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M32 52V30" strokeWidth="2.6" />
      <path d="M32 36c0-10 6-16 15-17.5C46 29 41 34.5 32 36Z" strokeWidth="2.3" />
      <path
        d="M32 40c0-8-4.5-12.5-11.5-14 .7 7.5 4.5 12.5 11.5 14Z"
        strokeWidth="2.3"
        opacity="0.6"
      />
    </svg>
  )
}

interface LogoProps {
  tone?: 'dark' | 'light'
  className?: string
}

export function Logo({ tone = 'dark', className }: LogoProps) {
  return (
    <Link
      to="/"
      aria-label="Aranya — home"
      className={cn(
        'group inline-flex items-center gap-2.5',
        tone === 'light' ? 'text-ivory-50' : 'text-forest-900',
        className,
      )}
    >
      <LogoMark
        className={cn(
          'transition-transform duration-500 group-hover:-rotate-6',
          tone === 'light' ? 'text-bronze-400' : 'text-bronze-700',
        )}
      />
      <span className="font-display text-[22px] leading-none font-semibold tracking-[0.32em]">
        ARANYA
      </span>
    </Link>
  )
}
