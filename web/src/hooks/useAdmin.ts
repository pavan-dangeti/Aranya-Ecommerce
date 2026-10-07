import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminCustomerQueryInput,
  AdminOrderQueryInput,
  AdminProductInput,
  AdminProductPatch,
  AdminProductQueryInput,
  AdminReviewQueryInput,
  OrderStatus,
} from '@aranya/shared'
import { adminApi } from '@/lib/api'

const KEYS = {
  dashboard: ['admin', 'dashboard'],
  products: ['admin', 'products'],
  orders: ['admin', 'orders'],
  customers: ['admin', 'customers'],
  reviews: ['admin', 'reviews'],
} as const

/**
 * Query key for a filtered admin list. The scope has to be spread, not nested,
 * or `invalidateQueries({ queryKey: scope })` stops matching these entries.
 */
const listKey = <T>(scope: readonly unknown[], query: T) => [...scope, query] as const

export function useAdminDashboard() {
  return useQuery({ queryKey: KEYS.dashboard, queryFn: adminApi.dashboard })
}

export function useAdminProducts(query: AdminProductQueryInput) {
  return useQuery({
    queryKey: listKey(KEYS.products, query),
    queryFn: () => adminApi.products(query),
    placeholderData: (prev) => prev,
  })
}

/** Any product write can change stock, so the low-stock panel is invalidated too. */
function useProductWrite<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  extra?: { id?: string },
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.products })
      queryClient.invalidateQueries({ queryKey: KEYS.dashboard })
      if (extra?.id) queryClient.invalidateQueries({ queryKey: ['product', extra.id] })
    },
  })
}

export function useCreateProduct() {
  return useProductWrite((input: AdminProductInput) => adminApi.createProduct(input))
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & AdminProductPatch) =>
      adminApi.updateProduct(id, input),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: KEYS.products })
      queryClient.invalidateQueries({ queryKey: KEYS.dashboard })
      queryClient.invalidateQueries({ queryKey: ['product', product.id] })
    },
  })
}

export function useDeleteProduct() {
  return useProductWrite(({ id }: { id: string }) => adminApi.deleteProduct(id))
}

export function useAdjustStock() {
  return useProductWrite(({ id, stock, reason }: { id: string; stock: number; reason?: string }) =>
    adminApi.adjustStock(id, stock, reason),
  )
}

export function useAdminOrders(query: AdminOrderQueryInput) {
  return useQuery({
    queryKey: listKey(KEYS.orders, query),
    queryFn: () => adminApi.orders(query),
    placeholderData: (prev) => prev,
  })
}

export function useSetOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminApi.setOrderStatus(id, status),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: KEYS.orders })
      queryClient.invalidateQueries({ queryKey: KEYS.dashboard })
      queryClient.invalidateQueries({ queryKey: ['order', order.id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useAdminCustomers(query: AdminCustomerQueryInput) {
  return useQuery({
    queryKey: listKey(KEYS.customers, query),
    queryFn: () => adminApi.customers(query),
    placeholderData: (prev) => prev,
  })
}

export function useAdminReviews(query: AdminReviewQueryInput) {
  return useQuery({
    queryKey: listKey(KEYS.reviews, query),
    queryFn: () => adminApi.reviews(query),
    placeholderData: (prev) => prev,
  })
}

export function useSetReviewStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Pending' | 'Approved' | 'Rejected' }) =>
      adminApi.setReviewStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.reviews })
      queryClient.invalidateQueries({ queryKey: KEYS.products })
      queryClient.invalidateQueries({ queryKey: KEYS.dashboard })
    },
  })
}
