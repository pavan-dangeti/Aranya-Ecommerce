import { cn } from '@/utils/cn'

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-2xl bg-forest-900/[0.07]', className)}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
      <Skeleton className="h-4 w-1/3 rounded-full" />
      <Skeleton className="h-5 w-2/3 rounded-full" />
      <Skeleton className="h-4 w-1/4 rounded-full" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-svh place-items-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid size-14 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-bronze-500/20 motion-reduce:hidden" />
          <svg
            viewBox="0 0 64 64"
            className="size-9 text-bronze-500"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M32 52V30" strokeWidth="2.5" />
            <path d="M32 36c0-10 6-16 15-17.5C46 29 41 34.5 32 36Z" strokeWidth="2.2" />
            <path
              d="M32 40c0-8-4.5-12.5-11.5-14 .7 7.5 4.5 12.5 11.5 14Z"
              strokeWidth="2.2"
              opacity="0.6"
            />
          </svg>
        </span>
        <span className="eyebrow text-forest-900/65">Preparing your ritual</span>
      </div>
    </div>
  )
}
