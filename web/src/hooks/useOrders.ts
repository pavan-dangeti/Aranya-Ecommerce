import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CartItem } from '@aranya/shared'
import { addressApi, orderApi, type OrderAddress, type PaymentMethod } from '@/lib/api'
import { useAuth } from './useAuth'

const ORDERS_KEY = ['orders'] as const
const ADDRESSES_KEY = ['addresses'] as const

/** Orders and addresses belong to an account, so they are only fetched once signed in. */
function useAuthed() {
  const { data: user } = useAuth()
  return Boolean(user)
}

export function useOrders() {
  const enabled = useAuthed()
  return useQuery({ queryKey: ORDERS_KEY, queryFn: orderApi.list, enabled })
}

export function useOrder(orderId: string) {
  const enabled = useAuthed()
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.byId(orderId),
    enabled: enabled && Boolean(orderId),
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      items?: CartItem[]
      address: OrderAddress
      paymentMethod: PaymentMethod
      upiId?: string
    }) => orderApi.place(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useAddresses() {
  const enabled = useAuthed()
  return useQuery({ queryKey: ADDRESSES_KEY, queryFn: addressApi.list, enabled })
}

export function useAddAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addressApi.add,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & AddressInput) => addressApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  })
}

/** The server clears the other defaults for us, so this is a plain update. */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & AddressInput) =>
      addressApi.update(id, { ...input, isDefault: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  })
}

export function useRemoveAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addressApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  })
}

type AddressInput = Parameters<typeof addressApi.add>[0]
