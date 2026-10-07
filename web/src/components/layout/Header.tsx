import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'framer-motion'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { Logo } from './Logo'
import { useUi } from '@/store/uiStore'
import { useCartView } from '@/hooks/useCartView'
import { useWishlist } from '@/hooks/useWishlist'
import { useLockBodyScroll } from '@/hooks'
import { cn } from '@/utils/cn'
import { EASE_ORGANIC } from '@/utils/motion'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { to: '/products', label: 'Shop' },
  { to: '/ingredients', label: 'Ingredients' },
  { to: '/story', label: 'Our Story' },
  { to: '/journal', label: 'Journal' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const location = useLocation()
  const navigate = useNavigate()
  const openSearch = useUi((s) => s.openSearch)
  const openCart = useUi((s) => s.openCart)
  const menuOpen = useUi((s) => s.menuOpen)
  const toggleMenu = useUi((s) => s.toggleMenu)
  const { count } = useCartView()
  const { data: wishlist = [] } = useWishlist()
  const { data: user } = useAuth()
  const overDarkHero = location.pathname === '/' && !scrolled && !menuOpen

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 32))

  useEffect(() => {
    toggleMenu(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSearch])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:bg-forest-900 focus:px-5 focus:py-2.5 focus:text-xs focus:font-semibold focus:text-ivory-50"
      >
        Skip to content
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled || menuOpen
            ? 'border-b border-forest-900/[0.07] bg-ivory-50/85 shadow-[0_8px_32px_-16px_rgb(11_24_17/0.18)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="shell flex h-[72px] items-center justify-between gap-6">
          <Logo tone={overDarkHero ? 'light' : 'dark'} />

          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'link-underline text-[13px] font-semibold tracking-wide transition-colors',
                    isActive
                      ? overDarkHero
                        ? 'text-bronze-300'
                        : 'text-bronze-700'
                      : overDarkHero
                        ? 'text-ivory-50/85 hover:text-ivory-50'
                        : 'text-forest-900/75 hover:text-forest-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <IconButton
              label="Search products"
              onClick={openSearch}
              tone={overDarkHero ? 'light' : 'dark'}
              shortcutHint
            >
              <Search size={19} strokeWidth={1.8} />
            </IconButton>
            <Link
              to="/wishlist"
              aria-label={`Wishlist, ${wishlist.length} item${wishlist.length === 1 ? '' : 's'}`}
              className={iconBtnClass(overDarkHero)}
            >
              <Heart size={19} strokeWidth={1.8} />
              {wishlist.length > 0 && <Dot value={wishlist.length} />}
            </Link>
            <IconButton
              label="Open cart"
              onClick={() => (count > 0 ? openCart() : navigate('/cart'))}
              tone={overDarkHero ? 'light' : 'dark'}
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              {count > 0 && <Dot value={count} />}
            </IconButton>
            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/profile') : '/login'}
              aria-label={
                user
                  ? user.role === 'admin'
                    ? 'Admin console'
                    : `Account — ${user.name}`
                  : 'Sign in'
              }
              className={cn(iconBtnClass(overDarkHero), 'hidden sm:grid')}
            >
              <User size={19} strokeWidth={1.8} />
            </Link>
            <button
              type="button"
              onClick={() => toggleMenu()}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className={cn(iconBtnClass(overDarkHero), 'lg:hidden')}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} strokeWidth={1.8} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu />}</AnimatePresence>
    </>
  )
}

function iconBtnClass(overDarkHero: boolean) {
  return cn(
    'relative grid size-10 cursor-pointer place-items-center rounded-full transition-colors',
    overDarkHero
      ? 'text-ivory-50 hover:bg-ivory-50/10'
      : 'text-forest-900 hover:bg-forest-900/[0.06]',
  )
}

function IconButton({
  label,
  onClick,
  tone,
  shortcutHint = false,
  children,
}: {
  label: string
  onClick: () => void
  tone: 'dark' | 'light'
  shortcutHint?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={iconBtnClass(tone === 'light')}
    >
      {children}
      {shortcutHint && (
        <kbd
          className={cn(
            'absolute -right-1.5 -bottom-0.5 hidden rounded border px-1 font-sans text-[9px] font-semibold md:block',
            tone === 'light'
              ? 'border-ivory-50/25 text-ivory-50/60'
              : 'border-forest-900/15 text-forest-900/65',
          )}
        >
          ⌘K
        </kbd>
      )}
    </button>
  )
}

function Dot({ value }: { value: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-bronze-500 px-1 py-px text-[9px] leading-none font-bold text-forest-950">
      {value > 9 ? '9+' : value}
    </span>
  )
}

function MobileMenu() {
  const close = useUi((s) => s.toggleMenu)
  const { data: user } = useAuth()
  useLockBodyScroll(true)

  const links = [
    ...NAV_LINKS,
    { to: '/products?sort=newest', label: 'New Arrivals' },
    user
      ? user.role === 'admin'
        ? { to: '/admin', label: 'Admin Console' }
        : { to: '/profile', label: 'My Account' }
      : { to: '/login', label: 'Sign in' },
  ]

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE_ORGANIC }}
      className="fixed inset-0 z-40 flex flex-col bg-forest-950 lg:hidden"
    >
      <div className="flex h-[72px] shrink-0 items-center px-5 pt-2">
        <Logo tone="light" />
      </div>
      <nav aria-label="Mobile" className="shell mt-10 flex flex-1 flex-col gap-2">
        {links.map((link, i) => (
          <m.div
            key={link.label}
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.5, ease: EASE_ORGANIC }}
          >
            <Link
              to={link.to}
              onClick={() => close(false)}
              className="block border-b border-ivory-50/[0.08] py-4 font-display text-3xl font-medium text-ivory-50 transition-colors hover:text-bronze-400"
            >
              {link.label}
            </Link>
          </m.div>
        ))}
      </nav>
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="eyebrow shell pb-10 text-sage-400/60"
      >
        Ancient Wisdom. Naturally Reimagined.
      </m.p>
    </m.div>
  )
}
