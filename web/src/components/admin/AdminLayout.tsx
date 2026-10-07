import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Menu,
  PackageSearch,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useToasts } from '@/store/toastStore'
import { Toasts } from '@/components/ui/Toasts'
import { ConfirmDialog } from './Overlays'
import { initials } from '@/utils/format'
import { cn } from '@/utils/cn'
import { EASE_ORGANIC } from '@/utils/motion'
import { useDocumentMeta } from '@/hooks'
import { useAuth, useLogout } from '@/hooks/useAuth'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: PackageSearch },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/inventory', label: 'Inventory', icon: Store },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareText },
]

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/customers': 'Customers',
  '/admin/inventory': 'Inventory',
  '/admin/reviews': 'Reviews',
}

export default function AdminLayout() {
  const { data: user, isPending: authPending } = useAuth()
  const logout = useLogout()
  const push = useToasts((s) => s.push)
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const title = TITLES[pathname] ?? 'Admin'
  useDocumentMeta(`${title} · Admin — ARANYA`)

  // A hard reload starts with no access token in memory; the silent refresh is
  // still in flight, so wait for it instead of bouncing to the login screen.
  if (authPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-forest-950">
        <p className="animate-pulse text-sm tracking-[0.14em] text-sage-300/70 uppercase">
          Checking your session…
        </p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login/admin" replace />
  if (user.role !== 'admin') return <Navigate to="/profile" replace />

  const doLogout = () => {
    logout.mutate()
    push('Signed out of the operations console', 'info')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-7 pt-8 pb-9">
        <svg
          viewBox="0 0 64 64"
          className="size-7 text-bronze-400"
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
        <div>
          <p className="font-display text-lg leading-none font-semibold tracking-[0.28em] text-ivory-50">
            ARANYA
          </p>
          <p className="mt-1 text-[9px] font-bold tracking-[0.24em] text-bronze-400/80 uppercase">
            Operations Console
          </p>
        </div>
      </div>

      <nav aria-label="Admin sections" className="flex-1 space-y-1 px-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-bronze-500/15 text-bronze-300 shadow-[inset_2px_0_0_var(--color-bronze-500)]'
                  : 'text-sage-300/70 hover:bg-ivory-50/[0.05] hover:text-ivory-50',
              )
            }
          >
            <item.icon size={17} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-ivory-50/[0.08] px-4 py-5">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-sage-300/70 transition-colors hover:bg-ivory-50/[0.05] hover:text-ivory-50"
        >
          <Store size={17} strokeWidth={1.8} /> View storefront
        </Link>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-sage-300/70 transition-colors hover:bg-clay-500/10 hover:text-clay-500"
        >
          <LogOut size={17} strokeWidth={1.8} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#08110c] text-ivory-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-ivory-50/[0.07] bg-forest-950 lg:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <m.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 cursor-pointer bg-forest-950/70 backdrop-blur-sm"
            />
            <m.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: EASE_ORGANIC }}
              className="absolute inset-y-0 left-0 w-72 border-r border-ivory-50/[0.08] bg-forest-950"
            >
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="absolute top-6 right-4 grid size-9 cursor-pointer place-items-center rounded-full text-sage-300/70 hover:text-ivory-50"
              >
                <X size={18} />
              </button>
              {sidebar}
            </m.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-ivory-50/[0.07] bg-forest-950/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-5 sm:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid size-10 cursor-pointer place-items-center rounded-xl text-sage-300/70 transition-colors hover:bg-ivory-50/[0.06] hover:text-ivory-50 lg:hidden"
            >
              <Menu size={19} />
            </button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs">
              <span className="text-sage-300/70">Admin</span>
              <span aria-hidden="true" className="text-sage-300/25">
                /
              </span>
              <span
                aria-current="page"
                className="truncate font-bold tracking-wide text-ivory-50 uppercase"
              >
                {title}
              </span>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full border border-bronze-500/40 bg-bronze-500/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-bronze-300 uppercase sm:block">
                Admin
              </span>
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-full bg-forest-800 font-display text-xs font-semibold text-bronze-300"
              >
                {initials(user.name)}
              </span>
            </div>
          </div>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:px-10">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doLogout}
        title="Sign out?"
        body="You will be returned to the admin sign-in screen. Every change you made is already saved to the server."
        confirmLabel="Sign out"
      />
      <Toasts />
    </div>
  )
}
