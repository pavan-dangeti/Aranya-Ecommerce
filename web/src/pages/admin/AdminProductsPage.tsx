import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { CategoryId, Product } from '@/types'
import { categoryName } from '@/data/categories'
import { useCategories } from '@/hooks/useCatalog'
import {
  useAdminProducts,
  useAdjustStock,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from '@/hooks/useAdmin'
import { useToasts } from '@/store/toastStore'
import { fieldErrors } from '@/utils/errors'
import { formatPrice } from '@/utils/format'
import { Drawer, ConfirmDialog } from '@/components/admin/Overlays'
import { Panel, TableShell, Td, EmptyRow } from '@/components/admin/AdminUI'
import { cn } from '@/utils/cn'

interface FormState {
  name: string
  category: CategoryId
  price: string
  compareAtPrice: string
  stock: string
  shortDescription: string
  description: string
  usage: string
  origin: string
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'herbal-supplements',
  price: '',
  compareAtPrice: '',
  stock: '50',
  shortDescription: '',
  description: '',
  usage: '',
  origin: '',
}

type SortOption = 'name-asc' | 'price-asc' | 'price-desc' | 'stock-asc'

export default function AdminProductsPage() {
  const push = useToasts((s) => s.push)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [sort, setSort] = useState<SortOption>('name-asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const { data: categories = [] } = useCategories()
  const { data: page, isPending } = useAdminProducts({
    search: search.trim() || undefined,
    category: category === 'all' ? undefined : category,
    sort,
    page: 1,
    pageSize: 48,
  })

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const adjustStock = useAdjustStock()

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice?.toString() ?? '',
      stock: String(product.stock),
      shortDescription: product.shortDescription,
      description: product.description,
      usage: product.usage,
      origin: product.origin,
    })
    setFormError(null)
    setFormOpen(true)
  }

  const [saving, setSaving] = useState(false)

  const submitForm = async () => {
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim()) return setFormError('Product name is required')
    if (!Number.isFinite(price) || price <= 0) return setFormError('Enter a valid price')
    if (!Number.isFinite(stock) || stock < 0) return setFormError('Enter a valid stock count')
    if (form.compareAtPrice && Number(form.compareAtPrice) <= price) {
      return setFormError('Compare-at price must be higher than the selling price')
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      stock,
      shortDescription: form.shortDescription.trim() || 'A new ARANYA preparation.',
      origin: form.origin.trim() || 'India',
    }

    setFormError(null)
    setSaving(true)

    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...payload })
        push(`“${payload.name}” updated`)
      } else {
        await createProduct.mutateAsync({
          ...payload,
          description: form.description.trim() || payload.shortDescription,
          usage: form.usage.trim() || 'Take as directed daily.',
          tags: ['new'],
          benefits: [],
          ingredients: [],
        })
        push(`“${payload.name}” added to the catalog`)
      }
      setFormOpen(false)
    } catch (err) {
      setFormError(fieldErrors(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-bronze-400">Catalog</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Products</h1>
        </div>
        <button
          type="button"
          onClick={openAdd}
          data-testid="admin-add-product"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-bronze-500 px-6 py-3 text-xs font-bold tracking-[0.12em] text-forest-950 uppercase transition-colors hover:bg-bronze-400"
        >
          <Plus size={15} /> Add Product
        </button>
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
              placeholder="Search products or tags…"
              aria-label="Search products"
              className="h-11 w-full rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] pr-4 pl-10 text-sm text-ivory-50 outline-none placeholder:text-sage-300/35 focus:border-bronze-500/60"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}
            aria-label="Filter by category"
            className="h-11 cursor-pointer appearance-none rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] px-4 text-sm font-semibold text-sage-200/85 outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort products"
            className="h-11 cursor-pointer appearance-none rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] px-4 text-sm font-semibold text-sage-200/85 outline-none"
          >
            <option value="name-asc">Sort: Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-asc">Stock: Low to High</option>
          </select>
        </div>

        <TableShell
          head={['Product', 'Category', 'Price', 'Stock', 'Rating', 'Actions']}
          minWidth={760}
        >
          {(page?.items ?? []).map((product) => (
            <tr key={product.id} className="transition-colors hover:bg-ivory-50/[0.02]">
              <Td>
                <p className="font-semibold text-ivory-50">{product.name}</p>
                <p className="mt-0.5 max-w-64 truncate text-xs text-sage-300/70">
                  {product.shortDescription}
                </p>
              </Td>
              <Td className="text-sage-300/70">{categoryName(product.category)}</Td>
              <Td className="tabular-nums">
                {formatPrice(product.price)}
                {product.compareAtPrice && (
                  <span className="ml-2 text-xs text-sage-300/70 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Decrease stock of ${product.name}`}
                    onClick={() =>
                      adjustStock.mutate({
                        id: product.id,
                        stock: Math.max(0, product.stock - 5),
                        reason: 'quick -5',
                      })
                    }
                    className="size-7 cursor-pointer rounded-lg border border-ivory-50/12 text-xs font-bold text-sage-200/70 transition-colors hover:border-bronze-500/50"
                  >
                    –
                  </button>
                  <span
                    className={cn(
                      'w-10 text-center font-bold tabular-nums',
                      product.stock <= 5
                        ? 'text-clay-400'
                        : product.stock <= 20
                          ? 'text-bronze-400'
                          : 'text-ivory-50',
                    )}
                  >
                    {product.stock}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase stock of ${product.name}`}
                    onClick={() =>
                      adjustStock.mutate({
                        id: product.id,
                        stock: product.stock + 5,
                        reason: 'quick +5',
                      })
                    }
                    className="size-7 cursor-pointer rounded-lg border border-ivory-50/12 text-xs font-bold text-sage-200/70 transition-colors hover:border-bronze-500/50"
                  >
                    +
                  </button>
                </div>
              </Td>
              <Td>{product.rating > 0 ? `★ ${product.rating}` : '—'}</Td>
              <Td>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    aria-label={`Edit ${product.name}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border border-ivory-50/12 text-sage-200/70 transition-colors hover:border-bronze-500/60 hover:text-bronze-400"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(product)}
                    aria-label={`Delete ${product.name}`}
                    className="grid size-8 cursor-pointer place-items-center rounded-lg border border-ivory-50/12 text-sage-200/70 transition-colors hover:border-clay-500/60 hover:text-clay-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
          {!isPending && (page?.items.length ?? 0) === 0 && (
            <EmptyRow colSpan={6} message="No products match this search." />
          )}
        </TableShell>
      </Panel>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit product' : 'Add product'}
      >
        <div className="space-y-4">
          <AdminField label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={adminInput}
            />
          </AdminField>
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CategoryId })}
                className={cn(adminInput, 'cursor-pointer appearance-none')}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Stock">
              <input
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/[^\d]/g, '') })}
                className={adminInput}
              />
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Price (₹)">
              <input
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d]/g, '') })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Compare-at price (₹, optional)">
              <input
                inputMode="numeric"
                value={form.compareAtPrice}
                onChange={(e) =>
                  setForm({ ...form, compareAtPrice: e.target.value.replace(/[^\d]/g, '') })
                }
                className={adminInput}
              />
            </AdminField>
          </div>
          <AdminField label="Short description">
            <textarea
              rows={3}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              className={cn(adminInput, 'h-auto resize-none py-3')}
            />
          </AdminField>
          {!editing && (
            <AdminField label="Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={cn(adminInput, 'h-auto resize-none py-3')}
              />
            </AdminField>
          )}
          {!editing && (
            <AdminField label="How to use">
              <input
                value={form.usage}
                onChange={(e) => setForm({ ...form, usage: e.target.value })}
                className={adminInput}
              />
            </AdminField>
          )}
          <AdminField label="Origin">
            <input
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className={adminInput}
            />
          </AdminField>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-clay-500/30 bg-clay-500/10 px-4 py-3 text-xs font-semibold text-clay-400"
            >
              {formError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void submitForm()}
            disabled={saving}
            className="w-full cursor-pointer rounded-full bg-bronze-500 py-4 text-xs font-bold tracking-[0.14em] text-forest-950 uppercase transition-colors hover:bg-bronze-400"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          const name = deleting.name
          try {
            await deleteProduct.mutateAsync({ id: deleting.id })
            setDeleting(null)
            push(`“${name}” removed from the catalog`, 'info')
          } catch (err) {
            push(fieldErrors(err).message, 'error')
          }
        }}
        title="Delete product?"
        body={`“${deleting?.name}” will be removed from the catalogue. Products that appear in past orders cannot be deleted — set their stock to zero instead.`}
      />
    </div>
  )
}

const adminInput =
  'h-12 w-full rounded-xl border border-ivory-50/10 bg-ivory-50/[0.04] px-4 text-sm text-ivory-50 outline-none transition-colors placeholder:text-sage-300/35 focus:border-bronze-500/60'

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold tracking-[0.16em] text-sage-300/70 uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}
