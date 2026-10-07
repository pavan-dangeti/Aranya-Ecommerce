import { Link } from 'react-router'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { formatPrice } from '@/utils/format'
import { StatCard, OrderStatusPill, Panel, TableShell, Td } from '@/components/admin/AdminUI'
import { MonthBars, Donut, HBars } from '@/components/admin/Charts'

export default function AdminDashboardPage() {
  const { data, isPending, isError, refetch } = useAdminDashboard()

  if (isError) {
    return (
      <div
        className="rounded-3xl border border-clay-500/25 bg-clay-500/[0.05] p-8 text-center"
        role="alert"
      >
        <p className="text-sm text-clay-400">Could not load the dashboard.</p>
        <button
          onClick={() => refetch()}
          className="link-underline mt-3 text-xs font-bold uppercase"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-ivory-50/[0.05]" />
        ))}
      </div>
    )
  }

  const awaitingAction = data.statusBreakdown
    .filter((s) => s.label === 'Pending' || s.label === 'Processing')
    .reduce((sum, s) => sum + s.value, 0)

  const topProducts = data.topProducts.map((p) => ({
    label: p.name,
    value: p.units,
    display: `${p.units} units`,
  }))

  return (
    <div className="space-y-8" data-testid="admin-overview">
      <div>
        <p className="eyebrow text-bronze-400">Overview</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Good to see you.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Revenue" value={formatPrice(data.revenue)} hint="all active orders" />
        <StatCard
          label="Orders"
          value={data.orders}
          hint={`${awaitingAction} awaiting action`}
          tone="sage"
        />
        <StatCard label="Customers" value={data.customers} hint="lifetime accounts" />
        <StatCard label="Products" value={data.products} hint="in catalogue" />
        <StatCard
          label="Low Stock"
          value={data.lowStock}
          hint={data.lowStock > 0 ? 'reorder suggested' : 'all healthy'}
          tone={data.lowStock > 0 ? 'clay' : 'sage'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Sales overview">
          <div className="p-6">
            <MonthBars data={data.revenueSeries} />
          </div>
        </Panel>
        <Panel title="Orders overview">
          <div className="p-6">
            <Donut segments={data.statusBreakdown} centerLabel="orders" centerValue={data.orders} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Product performance">
          <div className="p-6">
            {topProducts.length > 0 ? (
              <HBars data={topProducts} />
            ) : (
              <p className="py-8 text-center text-sm text-sage-300/70">No sales recorded yet.</p>
            )}
          </div>
        </Panel>

        <Panel
          title="Recent orders"
          actions={
            <Link
              to="/admin/orders"
              className="link-underline text-xs font-bold tracking-[0.14em] text-bronze-400 uppercase"
            >
              View all
            </Link>
          }
        >
          <TableShell head={['Order', 'Customer', 'Status', 'Total']} minWidth={480}>
            {data.recentOrders.map((order) => (
              <tr key={order.id}>
                <Td>
                  <span className="font-mono text-xs font-semibold">{order.reference}</span>
                </Td>
                <Td className="max-w-36 truncate">{order.customer}</Td>
                <Td>
                  <OrderStatusPill status={order.status} />
                </Td>
                <Td className="font-bold tabular-nums">{formatPrice(order.total)}</Td>
              </tr>
            ))}
          </TableShell>
        </Panel>
      </div>
    </div>
  )
}
