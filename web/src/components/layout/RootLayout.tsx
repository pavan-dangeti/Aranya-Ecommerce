import { Suspense, lazy } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import { Header } from './Header'
import { Footer } from './Footer'
import { PageLoader } from '@/components/ui/loaders'
import { Toasts } from '@/components/ui/Toasts'
import { useScrollToTop } from '@/hooks'

const CartDrawerLazy = lazy(() =>
  import('@/components/cart/CartDrawer').then((m) => ({ default: m.CartDrawer })),
)
const SearchOverlayLazy = lazy(() =>
  import('@/components/search/SearchOverlay').then((m) => ({ default: m.SearchOverlay })),
)
const QuickViewLazy = lazy(() =>
  import('@/components/products/QuickView').then((m) => ({ default: m.QuickView })),
)

export function RootLayout() {
  useScrollToTop()
  const location = useLocation()
  const isAuthScreen = [
    '/login',
    '/login/customer',
    '/register/customer',
    '/login/admin',
    '/forgot-password',
  ].includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col">
      {!isAuthScreen && <Header />}
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <Suspense key={location.pathname} fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </AnimatePresence>
      </main>
      {!isAuthScreen && <Footer />}

      <Suspense fallback={null}>
        <CartDrawerLazy />
      </Suspense>
      <Suspense fallback={null}>
        <SearchOverlayLazy />
      </Suspense>
      <Suspense fallback={null}>
        <QuickViewLazy />
      </Suspense>
      <Toasts />
    </div>
  )
}
