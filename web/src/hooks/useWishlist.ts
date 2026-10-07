import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from './useAuth'
import { wishlistApi, type Product } from '@/lib/api'
import { useToasts } from '@/store/toastStore'

const WISHLIST_KEY = ['wishlist'] as const

/**
 * The wishlist lives on the server, so it is only queried once somebody is
 * signed in. Visitors get an empty list rather than a stream of 401s.
 */
export function useWishlist() {
  const { data: user } = useAuth()

  return useQuery<Product[]>({
    queryKey: WISHLIST_KEY,
    queryFn: wishlistApi.view,
    enabled: Boolean(user),
  })
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()
  const { data: user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const push = useToasts((s) => s.push)

  const mutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId),
    onSuccess: ({ ids }, productId) =>
      push(ids.includes(productId) ? 'Saved to your wishlist' : 'Removed from your wishlist'),
    onError: (err) => push(err.message, 'error'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })

  const mutate = (productId: string) => {
    if (!user) {
      push('Sign in to save products to your wishlist', 'info')
      navigate('/login/customer', { state: { from: location.pathname + location.search } })
      return
    }
    mutation.mutate(productId)
  }

  return { ...mutation, mutate }
}

export function useIsInWishlist(productId: string) {
  const { data } = useWishlist()
  return data?.some((p) => p.id === productId) ?? false
}
