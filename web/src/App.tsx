import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { RootLayout } from '@/components/layout/RootLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ServerWaking } from '@/components/ui/ServerWaking'

const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('@/pages/OrderConfirmationPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const JournalPage = lazy(() => import('@/pages/JournalPage'))
const ArticlePage = lazy(() => import('@/pages/ArticlePage'))
const StoryPage = lazy(() => import('@/pages/StoryPage'))
const IngredientsPage = lazy(() => import('@/pages/IngredientsPage'))
const InfoPage = lazy(() => import('@/pages/InfoPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const AuthChooserPage = lazy(() => import('@/pages/AuthChooserPage'))
const CustomerLoginPage = lazy(() => import('@/pages/auth/CustomerLoginPage'))
const CustomerRegisterPage = lazy(() => import('@/pages/auth/CustomerRegisterPage'))
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const ProfilePage = lazy(() => import('@/pages/auth/ProfilePage'))

const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'))
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage'))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <ServerWaking />
          <BrowserRouter>
            <Routes>
              <Route element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/:slug" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order/:orderId" element={<OrderConfirmationPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="journal" element={<JournalPage />} />
                <Route path="journal/:slug" element={<ArticlePage />} />
                <Route path="story" element={<StoryPage />} />
                <Route path="ingredients" element={<IngredientsPage />} />
                <Route path="support/:topic" element={<InfoPage />} />
                <Route path="login" element={<AuthChooserPage />} />
                <Route path="login/customer" element={<CustomerLoginPage />} />
                <Route path="register/customer" element={<CustomerRegisterPage />} />
                <Route path="login/admin" element={<AdminLoginPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </MotionConfig>
      </LazyMotion>
    </ErrorBoundary>
  )
}
