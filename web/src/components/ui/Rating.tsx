import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/utils/cn'

interface RatingProps {
  value: number
  size?: number
  showValue?: boolean
  count?: number
  tone?: 'dark' | 'light'
  className?: string
}

export function Rating({
  value,
  size = 14,
  showValue = false,
  count,
  tone = 'dark',
  className,
}: RatingProps) {
  const full = Math.floor(value)
  const half = value - full >= 0.35 && full < 5
  const starColor = 'text-bronze-500 fill-bronze-500'
  const emptyColor = tone === 'light' ? 'text-ivory-50/25' : 'text-forest-900/15'

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex" role="img" aria-label={`Rated ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) =>
          i < full ? (
            <Star key={i} size={size} className={starColor} strokeWidth={1.5} />
          ) : i === full && half ? (
            <span key={i} className="relative inline-flex">
              <Star size={size} className={emptyColor} strokeWidth={1.5} />
              <StarHalf
                size={size}
                className={cn(starColor, 'absolute inset-0')}
                strokeWidth={1.5}
              />
            </span>
          ) : (
            <Star key={i} size={size} className={emptyColor} strokeWidth={1.5} />
          ),
        )}
      </span>
      {showValue && (
        <span
          className={cn(
            'text-sm font-semibold',
            tone === 'light' ? 'text-ivory-50/90' : 'text-forest-900',
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span
          className={cn('text-xs', tone === 'light' ? 'text-ivory-50/60' : 'text-forest-900/65')}
        >
          ({count.toLocaleString('en-IN')})
        </span>
      )}
    </span>
  )
}
