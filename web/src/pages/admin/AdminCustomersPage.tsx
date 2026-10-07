import { useState } from 'react'
import { Search } from 'lucide-react'
import type { CustomerStatus } from '@/types'
import { useAdminCustomers } from '@/hooks/useAdmin'
import { formatDate, formatPrice, initials } from '@/utils/format'
import { Panel, TableShell, Td, EmptyRow } from '@/components/admin/AdminUI'
import { cn } from '@/utils/cn'

const STATUS_TONE: Record<CustomerStatus, string> = {
  VIP: 'bg-bronze-500/15 text-bronze-300',
  Active: 'bg-moss-400/20 text-sage-200',
  Dormant: 'bg-ivory-50/[0.07] text-sage-300/70',
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'all'>('all')

  const { data: page, isPending } = useAdminCustomers({
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: 'spent-desc',
    page: 1,
    pageSize: 50,
  })
  const filtered = page?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-bronze-400">Community</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Customers</h1>
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
              placeholder="Search name, email or city…"
              aria-label="Search customers"
              data-testid="admin-customer-search"
              className="h-11 w-full rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] pr-4 pl-10 text-sm text-ivory-50 outline-none placeholder:text-sage-300/35 focus:border-bronze-500/60"
            />
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Filter by status">
            {(['all', 'VIP', 'Active', 'Dormant'] as const).map((status) => (
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
          head={['Customer', 'Email', 'City', 'Orders', 'Total spent', 'Status', 'With us since']}
          minWidth={860}
        >
          {filtered.map((customer) => (
            <tr key={customer.id} className="transition-colors hover:bg-ivory-50/[0.02]">
              <Td>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-800 font-display text-xs font-semibold text-bronze-300"
                  >
                    {initials(customer.name)}
                  </span>
                  <span className="font-semibold text-ivory-50">{customer.name}</span>
                </div>
              </Td>
              <Td className="text-sage-300/70">{customer.email}</Td>
              <Td>{customer.city}</Td>
              <Td className="tabular-nums">{customer.orders}</Td>
              <Td className="font-bold tabular-nums">{formatPrice(customer.spent)}</Td>
              <Td>
                <span
                  className={cn(
                    'inline-block rounded-full px-3 py-1 text-xs font-bold',
                    STATUS_TONE[customer.status],
                  )}
                >
                  {customer.status}
                </span>
              </Td>
              <Td className="text-sage-300/70">{formatDate(customer.memberSince)}</Td>
            </tr>
          ))}
          {!isPending && filtered.length === 0 && (
            <EmptyRow colSpan={7} message="No customers match this search." />
          )}
        </TableShell>
      </Panel>
    </div>
  )
}
