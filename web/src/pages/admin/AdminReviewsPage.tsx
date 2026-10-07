import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { ModerationStatus } from '@/types'
import { useAdminReviews, useSetReviewStatus } from '@/hooks/useAdmin'
import { useToasts } from '@/store/toastStore'
import { fieldErrors } from '@/utils/errors'
import { Rating } from '@/components/ui/Rating'
import { Panel } from '@/components/admin/AdminUI'
import { cn } from '@/utils/cn'

const FILTERS: Array<ModerationStatus | 'all'> = ['all', 'Pending', 'Approved', 'Rejected']

const statusTone: Record<ModerationStatus, string> = {
  Pending: 'bg-bronze-500/15 text-bronze-300',
  Approved: 'bg-moss-400/20 text-sage-200',
  Rejected: 'bg-clay-500/20 text-clay-400',
}

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<ModerationStatus | 'all'>('all')
  const push = useToasts((s) => s.push)
  const setReviewStatus = useSetReviewStatus()

  const { data: page, isPending } = useAdminReviews({
    status: filter === 'all' ? undefined : filter,
    sort: 'newest',
    page: 1,
    pageSize: 50,
  })
  const filtered = page?.items ?? []
  const pending = filtered.filter((r) => r.status === 'Pending').length

  const moderate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await setReviewStatus.mutateAsync({ id, status })
      push(
        status === 'Approved' ? 'Review approved' : 'Review rejected',
        status === 'Approved' ? 'success' : 'info',
      )
    } catch (err) {
      push(fieldErrors(err).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-bronze-400">Community</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Reviews</h1>
        </div>
        {pending > 0 && (
          <span className="rounded-full border border-bronze-500/40 bg-bronze-500/10 px-4 py-2 text-xs font-bold text-bronze-300">
            {pending} awaiting moderation
          </span>
        )}
      </div>

      <Panel>
        <div
          className="flex flex-wrap gap-1.5 border-b border-ivory-50/[0.08] px-6 py-4"
          role="group"
          aria-label="Filter by moderation status"
        >
          {FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
              className={cn(
                'cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all',
                filter === status
                  ? 'bg-bronze-500 text-forest-950'
                  : 'border border-ivory-50/12 text-sage-300/70 hover:border-bronze-500/40 hover:text-ivory-50',
              )}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>

        <ul className="divide-y divide-ivory-50/[0.05]">
          {filtered.map((review) => {
            return (
              <li
                key={review.id}
                className="flex flex-wrap items-start justify-between gap-4 px-6 py-5"
                data-testid={`admin-review-${review.id}`}
              >
                <div className="min-w-0 max-w-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <Rating value={review.rating} size={13} />
                    <span
                      className={cn(
                        'rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                        statusTone[review.status],
                      )}
                    >
                      {review.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-ivory-50">“{review.title}”</p>
                  <p className="mt-1 text-sm leading-relaxed text-sage-300/70">{review.body}</p>
                  <p className="mt-2 text-xs text-sage-300/70">
                    {review.author} · {review.location} ·{' '}
                    {new Date(review.date).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                    {
                      <>
                        {' '}
                        · on <span className="text-sage-300/70">{review.productName}</span>
                      </>
                    }
                  </p>
                </div>

                {review.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => void moderate(review.id, 'Approved')}
                    aria-label={`Approve review by ${review.author}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-moss-600/40 px-4 py-2 text-xs font-bold text-sage-200 transition-colors hover:bg-moss-600/70"
                  >
                    <Check size={13} /> Approve
                  </button>
                )}
                {review.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => void moderate(review.id, 'Rejected')}
                    aria-label={`Reject review by ${review.author}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-clay-500/40 px-4 py-2 text-xs font-bold text-clay-400 transition-colors hover:bg-clay-500/15"
                  >
                    <X size={13} /> Reject
                  </button>
                )}
              </li>
            )
          })}
          {!isPending && filtered.length === 0 && (
            <li className="px-6 py-14 text-center text-sm text-sage-300/70">
              {filter === 'all' ? 'No reviews yet.' : `No ${filter.toLowerCase()} reviews.`}
            </li>
          )}
        </ul>
      </Panel>
    </div>
  )
}
