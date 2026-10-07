import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { OrderStatus } from '@/types'

export function StatCard({
  label,
  value,
  hint,
  tone = 'bronze',
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'bronze' | 'sage' | 'clay'
}) {
  const toneClass =
    tone === 'clay' ? 'text-clay-400' : tone === 'sage' ? 'text-sage-400' : 'text-bronze-400'
  return (
    <div className="rounded-3xl border border-ivory-50/[0.08] bg-forest-900/70 p-6">
      <p className="text-[10px] font-bold tracking-[0.18em] text-sage-300/70 uppercase">{label}</p>
      <p className="mt-3 font-display text-3xl font-medium text-ivory-50">{value}</p>
      {hint && <p className={cn('mt-1.5 text-xs', toneClass)}>{hint}</p>}
    </div>
  )
}

const statusTone: Record<OrderStatus | 'Pending', string> = {
  Pending: 'bg-bronze-500/15 text-bronze-300',
  Processing: 'bg-sage-400/15 text-sage-300',
  Shipped: 'bg-moss-400/20 text-sage-200',
  Delivered: 'bg-forest-600/40 text-sage-200',
  Cancelled: 'bg-clay-500/20 text-clay-400',
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn('inline-block rounded-full px-3 py-1 text-xs font-bold', statusTone[status])}
    >
      {status}
    </span>
  )
}

export function TableShell({
  head,
  children,
  minWidth = 720,
}: {
  head: string[]
  children: ReactNode
  minWidth?: number
}) {
  return (
    // Focusable so keyboard users can scroll the table sideways on narrow screens.
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Table">
      <table className="w-full text-left text-sm text-sage-200/85" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-ivory-50/[0.08]">
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="px-5 py-4 text-[10px] font-bold tracking-[0.18em] text-sage-300/70 uppercase first:pl-6 last:pr-6"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ivory-50/[0.05]">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void
}) {
  return (
    <td onClick={onClick} className={cn('px-5 py-4 first:pl-6 last:pr-6', className)}>
      {children}
    </td>
  )
}

export function Panel({
  title,
  actions,
  children,
}: {
  title?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-ivory-50/[0.08] bg-forest-900/70">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory-50/[0.08] px-6 py-4">
          {title && <h2 className="font-display text-lg font-medium text-ivory-50">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-14 text-center text-sm text-sage-300/70">
        {message}
      </td>
    </tr>
  )
}
