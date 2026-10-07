import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Order, OrderStatus } from '@aranya/shared'
import { useAdminOrders, useSetOrderStatus } from '@/hooks/useAdmin'
import { useToasts } from '@/store/toastStore'
import { fieldErrors } from '@/utils/errors'
import { formatDate, formatPrice } from '@/utils/format'
import { Drawer } from '@/components/admin/Overlays'
import { Panel, TableShell, Td, EmptyRow, OrderStatusPill } from '@/components/admin/AdminUI'
import { cn } from '@/utils/cn'

const STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const paymentLabel: Record<Order['paymentMethod'], string> = {
  upi: 'UPI (simulated)',
  card: 'Card (simulated)',
  cod: 'Cash on Delivery',
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const push = useToasts((s) => s.push)
  const setOrderStatus = useSetOrderStatus()

  const { data: page, isPending } = useAdminOrders({
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: 'newest',
    page: 1,
    pageSize: 50,
  })
  const filtered = page?.items ?? []

  const changeStatus = async (order: Order, status: OrderStatus) => {
    try {
      const updated = await setOrderStatus.mutateAsync({ id: order.id, status })
      if (selected?.id === order.id) setSelected(updated)
      push(`Order ${order.reference} marked ${status.toLowerCase()}`)
    } catch (err) {
      push(fieldErrors(err).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-bronze-400">Fulfilment</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Orders</h1>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-3 border-b border-ivory-50/[0.08] px-6 py-4">
          <div className="relative min-w-52 flex-1">
            <Search
              size={15}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-sage-300/70"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or customer…"
              aria-label="Search orders"
              className="h-11 w-full rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] pr-4 pl-10 text-sm text-ivory-50 outline-none placeholder:text-sage-300/35 focus:border-bronze-500/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {(['all', ...STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all',
                  statusFilter === status
                    ? 'bg-bronze-500 text-forest-950'
                    : 'border border-ivory-50/12 text-sage-300/70 hover:border-bronze-500/40 hover:text-ivory-50',
                )}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        <TableShell
          head={['Order ID', 'Customer', 'Date', 'Items', 'Amount', 'Status']}
          minWidth={820}
        >
          {filtered.map((order) => (
            <tr
              key={order.id}
              onClick={() => setSelected(order)}
              className="cursor-pointer transition-colors hover:bg-ivory-50/[0.03]"
              data-testid={`admin-order-${order.id}`}
            >
              <Td>
                <span className="font-mono text-xs font-semibold text-bronze-300">{order.id}</span>
              </Td>
              <Td className="font-semibold">{order.address.fullName}</Td>
              <Td className="text-sage-300/70">{formatDate(order.placedAt)}</Td>
              <Td>{order.items.reduce((sum, i) => sum + i.qty, 0)}</Td>
              <Td className="font-bold tabular-nums">{formatPrice(order.total)}</Td>
              <Td onClick={(e) => e.stopPropagation()}>
                <select
                  value={order.status}
                  onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}
                  aria-label={`Status of order ${order.id}`}
                  className="cursor-pointer appearance-none rounded-full border border-ivory-50/12 bg-transparent px-3 py-1.5 text-xs font-bold text-sage-200/85 outline-none focus:border-bronze-500/60"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-forest-900">
                      {s}
                    </option>
                  ))}
                </select>
              </Td>
            </tr>
          ))}
          {!isPending && filtered.length === 0 && (
            <EmptyRow colSpan={6} message="No orders match this filter." />
          )}
        </TableShell>
      </Panel>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.id}` : ''}
      >
        {selected && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <OrderStatusPill status={selected.status} />
              <span className="text-xs text-sage-300/70">
                Placed {formatDate(selected.placedAt)}
              </span>
            </div>

            <section>
              <h3 className="eyebrow mb-3 text-sage-300/70">Items</h3>
              <ul className="divide-y divide-ivory-50/[0.06] rounded-2xl border border-ivory-50/[0.08]">
                {selected.items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                  >
                    <span>
                      <span className="font-semibold text-ivory-50">{item.name}</span>
                      <span className="ml-2 text-sage-300/70">× {item.qty}</span>
                    </span>
                    <span className="font-bold tabular-nums">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="eyebrow mb-3 text-sage-300/70">Customer</h3>
              <div className="rounded-2xl border border-ivory-50/[0.08] p-5 text-sm leading-relaxed text-sage-200/80">
                <p className="font-semibold text-ivory-50">{selected.address.fullName}</p>
                <p className="mt-1">{selected.address.email}</p>
                <p className="mt-1">{selected.address.phone}</p>
                <p className="mt-2 text-sage-300/70">
                  {selected.address.addressLine}, {selected.address.city},<br />
                  {selected.address.state} {selected.address.postalCode}, {selected.address.country}
                </p>
              </div>
            </section>

            <section>
              <h3 className="eyebrow mb-3 text-sage-300/70">Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-sage-300/70">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(selected.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-sage-300/70">
                  <dt>Shipping</dt>
                  <dd>{selected.shipping === 0 ? 'Free' : formatPrice(selected.shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-ivory-50/[0.08] pt-2 font-display text-lg font-semibold text-ivory-50">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(selected.total)}</dd>
                </div>
                <div className="flex justify-between pt-1 text-xs text-sage-300/70">
                  <dt>Payment</dt>
                  <dd>{paymentLabel[selected.paymentMethod]}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="eyebrow mb-3 text-sage-300/70">Update status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => changeStatus(selected, status)}
                    className={cn(
                      'cursor-pointer rounded-full px-4 py-2.5 text-xs font-bold transition-all',
                      selected.status === status
                        ? 'bg-bronze-500 text-forest-950'
                        : 'border border-ivory-50/12 text-sage-300/70 hover:border-bronze-500/40 hover:text-ivory-50',
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}
