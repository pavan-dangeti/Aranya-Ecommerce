import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReviewInput } from '@aranya/shared'
import { productApi, reviewApi, type ProductQueryInput } from '@/lib/api'

export function useProducts(params: ProductQueryInput, enabled = true) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.query(params),
    placeholderData: (prev) => prev,
    enabled,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.bySlug(slug),
    enabled: !!slug,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.featured(),
  })
}

export function useRelatedProducts(slug: string, limit = 4) {
  return useQuery({
    queryKey: ['product', slug, 'related', limit],
    queryFn: () => productApi.related(slug, limit),
    enabled: !!slug,
  })
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewApi.byProduct(productId),
    enabled: !!productId,
  })
}

export function useAddReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReviewInput) => reviewApi.add(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
    },
  })
}
