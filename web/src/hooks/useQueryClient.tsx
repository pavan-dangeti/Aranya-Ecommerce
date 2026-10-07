import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError, productApi } from '@/lib/api'

const NON_RETRYABLE = [401, 403, 404, 422]

function makeQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retrying an auth, permission or validation failure never helps.
        retry: (failureCount, error) =>
          error instanceof ApiError && NON_RETRYABLE.includes(error.status)
            ? false
            : failureCount < 3,
        refetchOnWindowFocus: false,
      },
    },
  })

  // A product page's headline needs its data; fetch it alongside the route
  // chunk instead of after it.
  const slug = window.location.pathname.match(/^\/products\/([^/]+)$/)?.[1]
  if (slug) {
    const decoded = decodeURIComponent(slug)
    void client.prefetchQuery({
      queryKey: ['product', decoded],
      queryFn: () => productApi.bySlug(decoded),
    })
  }
  return client
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
