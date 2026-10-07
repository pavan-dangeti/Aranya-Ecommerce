import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router'
import { m, useSpring } from 'framer-motion'
import { cn } from '@/utils/cn'
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks'

type Variant = 'primary' | 'bronze' | 'outline' | 'ghost' | 'outlineLight'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-forest-900 text-ivory-50 hover:bg-forest-700 shadow-[0_10px_24px_-12px_rgb(11_24_17/0.5)]',
  bronze:
    'bg-bronze-500 text-forest-950 hover:bg-bronze-400 shadow-[0_10px_24px_-12px_rgb(143_107_63/0.6)]',
  outline:
    'border border-forest-900/25 text-forest-900 hover:border-forest-900/60 hover:bg-forest-900/[0.04]',
  outlineLight:
    'border border-ivory-50/30 text-ivory-50 hover:border-ivory-50/70 hover:bg-ivory-50/[0.06]',
  ghost: 'text-current hover:opacity-70',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-[11px] tracking-[0.14em]',
  md: 'h-12 px-7 text-xs tracking-[0.16em]',
  lg: 'h-14 px-9 text-[13px] tracking-[0.16em]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  magnetic?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', magnetic = false, className, children, ...rest },
  ref,
) {
  const reducedMotion = usePrefersReducedMotion()
  const isFinePointer = useMediaQuery('(pointer: fine)')
  const enableMagnet = magnetic && isFinePointer && !reducedMotion
  const x = useSpring(0, { stiffness: 180, damping: 16, mass: 0.4 })
  const y = useSpring(0, { stiffness: 180, damping: 16, mass: 0.4 })
  const hostRef = useRef<HTMLButtonElement>(null)

  return (
    <m.button
      ref={(node) => {
        hostRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      style={enableMagnet ? { x, y } : undefined}
      onMouseMove={
        enableMagnet
          ? (e) => {
              const rect = hostRef.current?.getBoundingClientRect()
              if (!rect) return
              x.set((e.clientX - (rect.left + rect.width / 2)) * 0.22)
              y.set((e.clientY - (rect.top + rect.height / 2)) * 0.28)
            }
          : undefined
      }
      onMouseLeave={
        enableMagnet
          ? () => {
              x.set(0)
              y.set(0)
            }
          : undefined
      }
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold uppercase transition-colors duration-300 select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </m.button>
  )
})

interface ButtonLinkProps {
  to: string
  variant?: Variant
  size?: Size
  magnetic?: boolean
  className?: string
  children: ReactNode
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className,
  children,
}: ButtonLinkProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isFinePointer = useMediaQuery('(pointer: fine)')
  const enableMagnet = magnetic && isFinePointer && !reducedMotion
  const x = useSpring(0, { stiffness: 180, damping: 16, mass: 0.4 })
  const y = useSpring(0, { stiffness: 180, damping: 16, mass: 0.4 })
  const hostRef = useRef<HTMLAnchorElement>(null)

  return (
    <m.div
      style={enableMagnet ? { x, y } : undefined}
      onMouseMove={
        enableMagnet
          ? (e) => {
              const rect = hostRef.current?.getBoundingClientRect()
              if (!rect) return
              x.set((e.clientX - (rect.left + rect.width / 2)) * 0.22)
              y.set((e.clientY - (rect.top + rect.height / 2)) * 0.28)
            }
          : undefined
      }
      onMouseLeave={
        enableMagnet
          ? () => {
              x.set(0)
              y.set(0)
            }
          : undefined
      }
      className="inline-flex"
    >
      <Link
        ref={hostRef}
        to={to}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase transition-colors duration-300 select-none active:scale-[0.97]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
      >
        {children}
      </Link>
    </m.div>
  )
}
