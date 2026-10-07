import { useSyncExternalStore } from 'react'
import { isServerWaking, subscribeServerWaking } from '@/lib/api'

export function ServerWaking() {
  const waking = useSyncExternalStore(subscribeServerWaking, isServerWaking)
  if (!waking) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-100 bg-bronze-700 px-4 py-2 text-center text-xs font-semibold tracking-wide text-ivory-50"
    >
      Waking up the server… free hosting sleeps when idle, this can take up to a minute.
    </div>
  )
}
