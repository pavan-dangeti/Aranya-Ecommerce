import { useState } from 'react'
import { Search } from 'lucide-react'
import { CRITICAL_STOCK_THRESHOLD, LOW_STOCK_THRESHOLD } from '@aranya/shared/constants'
import { useAdminProducts, useAdjustStock } from '@/hooks/useAdmin'
import { useToasts } from '@/store/toastStore'
import { categoryName } from '@/data/categories'
import { Panel, TableShell, Td, EmptyRow } from '@/components/admin/AdminUI'
import { cn } from '@/utils/cn'

type StockFilter = 'all' | 'low' | 'critical' | 'out'

function stockStatus(stock: number): { label: string; tone: string; level: StockFilter } {
  if (stock === 0)
    return { label: 'Out of stock', tone: 'bg-clay-500/20 text-clay-400', level: 'out' }
  if (stock <= CRITICAL_STOCK_THRESHOLD)
    return { label: 'Critical', tone: 'bg-clay-500/15 text-clay-400', level: 'critical' }
  if (stock <= LOW_STOCK_THRESHOLD)
    return { label: 'Low stock', tone: 'bg-bronze-500/15 text-bronze-300', level: 'low' }
  return { label: 'Healthy', tone: 'bg-moss-400/20 text-sage-200', level: 'all' }
}

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StockFilter>('all')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const push = useToasts((s) => s.push)
  const adjustStock = useAdjustStock()

  const { data: page, isPending } = useAdminProducts({
    search: search.trim() || undefined,
    stockState: filter === 'all' ? 'all' : filter,
    sort: 'stock-asc',
    page: 1,
    pageSize: 48,
  })
  const filtered = page?.items ?? []

  const draftValue = (id: string, stock: number) => drafts[id] ?? String(stock)

  const commit = (id: string, name: string) => {
    const raw = drafts[id]
    if (raw === undefined) return
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) {
      push('Enter a valid stock count', 'error')
      return
    }
    adjustStock.mutate({ id, stock: Math.round(value), reason: 'inventory sheet' })
    setDrafts((d) => {
      const next = { ...d }
      delete next[id]
      return next
    })
    push(`Stock updated for “${name}”`)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-bronze-400">Warehouse</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Inventory</h1>
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
              placeholder="Search products…"
              aria-label="Search inventory"
              className="h-11 w-full rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] pr-4 pl-10 text-sm text-ivory-50 outline-none placeholder:text-sage-300/35 focus:border-bronze-500/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by stock level">
            {(['all', 'low', 'critical', 'out'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilter(level)}
                aria-pressed={filter === level}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-2 text-xs font-bold capitalize transition-all',
                  filter === level
                    ? 'bg-bronze-500 text-forest-950'
                    : 'border border-ivory-50/12 text-sage-300/70 hover:border-bronze-500/40 hover:text-ivory-50',
                )}
              >
                {level === 'all'
                  ? 'All'
                  : level === 'low'
                    ? `Low (≤${LOW_STOCK_THRESHOLD})`
                    : level === 'critical'
                      ? `Critical (≤${CRITICAL_STOCK_THRESHOLD})`
                      : 'Out (0)'}
              </button>
            ))}
          </div>
        </div>

        <TableShell head={['Product', 'Category', 'Stock', 'Warning', 'Status', '']} minWidth={780}>
          {filtered.map((product) => {
            const status = stockStatus(product.stock)
            return (
              <tr key={product.id} className="transition-colors hover:bg-ivory-50/[0.02]">
                <Td className="font-semibold text-ivory-50">{product.name}</Td>
                <Td className="text-sage-300/70">{categoryName(product.category)}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Decrease stock of ${product.name}`}
                      onClick={() =>
                        adjustStock.mutate({
                          id: product.id,
                          stock: Math.max(0, product.stock - 1),
                          reason: 'quick -1',
                        })
                      }
                      className="size-7 cursor-pointer rounded-lg border border-ivory-50/12 text-xs font-bold text-sage-200/70 transition-colors hover:border-bronze-500/50"
                    >
                      –
                    </button>
                    <input
                      value={draftValue(product.id, product.stock)}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [product.id]: e.target.value.replace(/[^\d]/g, ''),
                        }))
                      }
                      onBlur={() => commit(product.id, product.name)}
                      onKeyDown={(e) => e.key === 'Enter' && commit(product.id, product.name)}
                      aria-label={`Stock count for ${product.name}`}
                      className={cn(
                        'h-9 w-14 rounded-lg border border-ivory-50/12 bg-transparent text-center text-sm font-bold tabular-nums outline-none focus:border-bronze-500/60',
                        product.stock <= 5
                          ? 'text-clay-400'
                          : product.stock <= 20
                            ? 'text-bronze-400'
                            : 'text-ivory-50',
                      )}
                    />
                    <button
                      type="button"
                      aria-label={`Increase stock of ${product.name}`}
                      onClick={() =>
                        adjustStock.mutate({
                          id: product.id,
                          stock: product.stock + 1,
                          reason: 'quick +1',
                        })
                      }
                      className="size-7 cursor-pointer rounded-lg border border-ivory-50/12 text-xs font-bold text-sage-200/70 transition-colors hover:border-bronze-500/50"
                    >
                      +
                    </button>
                  </div>
                </Td>
                <Td>
                  <span
                    className={cn(
                      'inline-block rounded-full px-3 py-1 text-xs font-bold',
                      status.tone,
                    )}
                  >
                    {status.label}
                  </span>
                </Td>
                <Td className="text-sage-300/70">
                  {product.stock === 0
                    ? 'Awaiting restock'
                    : product.stock <= CRITICAL_STOCK_THRESHOLD
                      ? 'Reorder immediately'
                      : product.stock <= LOW_STOCK_THRESHOLD
                        ? 'Reorder suggested'
                        : 'In stock'}
                </Td>
                <Td>
                  {drafts[product.id] !== undefined &&
                    Number(drafts[product.id]) !== product.stock && (
                      <button
                        type="button"
                        onClick={() => commit(product.id, product.name)}
                        className="cursor-pointer rounded-full bg-bronze-500 px-4 py-1.5 text-[10px] font-bold tracking-[0.12em] text-forest-950 uppercase"
                      >
                        Save
                      </button>
                    )}
                </Td>
              </tr>
            )
          })}
          {!isPending && filtered.length === 0 && (
            <EmptyRow colSpan={6} message="Nothing matches this filter." />
          )}
        </TableShell>
      </Panel>
    </div>
  )
}
