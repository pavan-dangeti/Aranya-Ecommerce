import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  ApiError,
  authApi,
  cartApi,
  getAccessToken,
  onAuthLost,
  setAccessToken,
  type User,
} from '@/lib/api'
import { useGuestCart } from '@/store/guestCartStore'

const AUTH_KEY = ['auth', 'me'] as const

/**
 * The session user, or null while signed out.
 *
 * On a hard reload there is no access token in memory, so this first tries the
 * httpOnly refresh cookie. Doing both in one query means `isPending` stays true
 * for the whole handshake, which is what route guards wait on — splitting the
 * restore into a separate effect races them and bounces signed-in users to the
 * login screen.
 */
export function useAuth() {
  return useQuery<User | null>({
    queryKey: AUTH_KEY,
    queryFn: async () => {
      if (!getAccessToken()) return authApi.restore()
      try {
        return await authApi.me()
      } catch (err) {
        // A dead access token with no refresh cookie is simply signed out.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null
        throw err
      }
    },
    retry: false,
    staleTime: Infinity,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      authApi.login(input.email, input.password),
    onSuccess: async (user) => {
      queryClient.setQueryData(AUTH_KEY, user)
      await mergeGuestCart(queryClient)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string; phone?: string }) =>
      authApi.register(input.name, input.email, input.password, input.phone),
    onSuccess: async (user) => {
      queryClient.setQueryData(AUTH_KEY, user)
      await mergeGuestCart(queryClient)
    },
  })
}

/**
 * Folds whatever the visitor added before signing in into their server cart,
 * then drops the local copy. A failed merge must never block the sign-in.
 */
async function mergeGuestCart(queryClient: QueryClient): Promise<void> {
  const items = useGuestCart.getState().items
  if (items.length === 0) return

  try {
    await cartApi.merge(items)
    useGuestCart.getState().clear()
  } catch {
    // Keep the guest cart so the merge can be retried on the next sign-in.
  }

  await queryClient.invalidateQueries({ queryKey: ['cart'] })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      setAccessToken(null)
      queryClient.clear()
    },
  })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      authApi.resetPassword(input.token, input.password),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Pick<User, 'name' | 'phone'>>) => authApi.updateProfile(patch),
    onSuccess: (user) => queryClient.setQueryData(AUTH_KEY, user),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(input.currentPassword, input.newPassword),
  })
}

/**
 * Marks the session as signed out when a request comes back 401 and the
 * refresh cookie could not rescue it. Mounted once at the app root.
 *
 * Deliberately does not clear the query cache: wiping it while the auth query
 * is mounted makes it refetch, which 401s again and loops.
 */
export function useAuthGuard() {
  const queryClient = useQueryClient()

  useEffect(() => {
    onAuthLost(() => {
      setAccessToken(null)
      queryClient.setQueryData(AUTH_KEY, null)
    })
  }, [queryClient])

  return null
}
