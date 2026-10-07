import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { AnimatePresence, m } from 'framer-motion'
import { Heart, MapPin, PackageOpen, Plus, Trash2 } from 'lucide-react'
import type { Address, Order } from '@/types'
import { useWishlist } from '@/hooks/useWishlist'
import { useToasts } from '@/store/toastStore'
import { formatDate, formatPrice, initials } from '@/utils/format'
import { validPhoneIN, validPostalIN, required } from '@/utils/validate'
import { PageShell } from '../PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/admin/Overlays'
import { inputStyles } from './AuthLayout'
import { useDocumentMeta } from '@/hooks'
import { fieldErrors } from '@/utils/errors'
import { cn } from '@/utils/cn'
import { useAuth, useChangePassword, useLogout, useUpdateProfile } from '@/hooks/useAuth'
import {
  useAddAddress,
  useAddresses,
  useOrders,
  useRemoveAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from '@/hooks/useOrders'

/** The API patches a whole address, so promoting one means resending it with isDefault. */
function toAddressInput(address: Address) {
  const { isDefault: _isDefault, ...input } = address
  return input
}

type Tab = 'profile' | 'orders' | 'addresses'

export default function ProfilePage() {
  const { data: user, isPending: authPending } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()
  const { data: wishlist = [] } = useWishlist()
  const { data: addresses = [] } = useAddresses()
  const { data: orders } = useOrders()
  const addAddress = useAddAddress()
  const updateAddress = useUpdateAddress()
  const removeAddress = useRemoveAddress()
  const setDefaultAddress = useSetDefaultAddress()
  const push = useToasts((s) => s.push)

  const [tab, setTab] = useState<Tab>('profile')
  const [editingProfile, setEditingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [addressModal, setAddressModal] = useState<{
    mode: 'add' | 'edit'
    address?: Address
  } | null>(null)
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  useDocumentMeta('My Account — ARANYA')

  if (authPending) {
    return (
      <PageShell className="bg-ivory-50">
        <div className="shell py-32 text-center">
          <p className="eyebrow animate-pulse text-forest-900/65">Checking your session…</p>
        </div>
      </PageShell>
    )
  }
  if (!user && !loggingOut)
    return <Navigate to="/login/customer" state={{ from: '/profile' }} replace />

  const handleLogout = () => {
    setConfirmLogout(false)
    setLoggingOut(true)
    navigate('/', { replace: true })
    logout.mutate()
  }

  if (!user) return <Navigate to="/login/customer" state={{ from: '/profile' }} replace />

  return (
    <PageShell className="bg-ivory-50 pb-28">
      <header className="border-b hairline bg-gradient-to-b from-forest-900 to-forest-950 pt-36 pb-16 text-ivory-50">
        <div className="shell flex flex-wrap items-center gap-6">
          <span
            aria-hidden="true"
            className="grid size-20 place-items-center rounded-full border border-bronze-400/40 bg-bronze-500/10 font-display text-2xl font-semibold text-bronze-300"
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-bronze-400">My Account</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{user.name}</h1>
            <p className="mt-1 text-sm text-sage-300/70">
              {user.email}
              {user.phone && <> · {user.phone}</>} · with the grove since{' '}
              {formatDate(user.memberSince)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            data-testid="logout"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ivory-50/20 px-5 py-3 text-xs font-bold tracking-[0.14em] uppercase transition-colors hover:border-clay-500 hover:text-clay-500"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="shell pt-10">
        <div role="tablist" aria-label="Account sections" className="flex flex-wrap gap-2">
          {(
            [
              ['profile', 'Profile'],
              ['orders', 'Orders'],
              ['addresses', 'Addresses'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'cursor-pointer rounded-full px-6 py-3 text-xs font-bold tracking-[0.14em] uppercase transition-all',
                tab === id
                  ? 'bg-forest-900 text-ivory-50 shadow-lift'
                  : 'bg-forest-900/[0.05] text-forest-900/65 hover:bg-forest-900/[0.09]',
              )}
            >
              {label}
            </button>
          ))}
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-2 rounded-full bg-forest-900/[0.05] px-6 py-3 text-xs font-bold tracking-[0.14em] text-forest-900/65 uppercase transition-colors hover:bg-forest-900/[0.09] hover:text-forest-900"
          >
            <Heart size={13} /> Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="mt-10"
          >
            {tab === 'profile' && (
              <div className="grid gap-6 sm:grid-cols-2 lg:max-w-3xl">
                <InfoCard title="Email" value={user.email} />
                <InfoCard title="Phone" value={user.phone ?? 'Not provided yet'} />
                <InfoCard title="Member since" value={formatDate(user.memberSince)} />
                <InfoCard
                  title="Account type"
                  value={user.role === 'admin' ? 'Administrator' : 'Customer'}
                />
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(true)}
                    data-testid="edit-profile"
                    className="link-underline cursor-pointer text-xs font-bold text-bronze-700 uppercase"
                  >
                    Edit profile details
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangingPassword(true)}
                    data-testid="change-password"
                    className="link-underline cursor-pointer text-xs font-bold text-bronze-700 uppercase"
                  >
                    Change password
                  </button>
                </div>
              </div>
            )}

            {tab === 'orders' && <OrdersTab orders={orders} />}

            {tab === 'addresses' && (
              <div className="max-w-3xl">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-forest-900/65">Addresses used at checkout.</p>
                  <button
                    type="button"
                    onClick={() => setAddressModal({ mode: 'add' })}
                    data-testid="add-address"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-ivory-50 uppercase transition-colors hover:bg-forest-700"
                  >
                    <Plus size={14} /> Add address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="mt-6 rounded-3xl border hairline bg-ivory-100/70 p-12 text-center">
                    <MapPin size={26} className="mx-auto text-forest-900/30" strokeWidth={1.5} />
                    <p className="mt-4 text-sm text-forest-900/65">No saved addresses yet.</p>
                  </div>
                ) : (
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {addresses.map((address) => (
                      <li
                        key={address.id}
                        className={cn(
                          'rounded-3xl border p-6 transition-colors',
                          address.isDefault
                            ? 'border-bronze-500/50 bg-bronze-500/[0.05]'
                            : 'hairline bg-ivory-100/70',
                        )}
                        data-testid="address-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold tracking-[0.14em] text-bronze-700 uppercase">
                              {address.label}{' '}
                              {address.isDefault && (
                                <span className="ml-1 text-forest-900/65">· Default</span>
                              )}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-forest-900/75">
                              {address.fullName}
                              <br />
                              {address.addressLine}
                              <br />
                              {address.city}, {address.state} {address.postalCode}
                              <br />
                              {address.phone}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAddressModal({ mode: 'edit', address })}
                              aria-label={`Edit ${address.label} address`}
                              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold text-forest-900/65 uppercase hover:text-bronze-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingAddress(address)}
                              aria-label={`Delete ${address.label} address`}
                              className="grid cursor-pointer place-items-center rounded-lg p-1.5 text-forest-900/65 transition-colors hover:text-clay-500"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        {!address.isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setDefaultAddress.mutate(toAddressInput(address))
                              push('Default address updated')
                            }}
                            className="link-underline mt-4 cursor-pointer text-xs font-bold text-forest-900/65 uppercase"
                          >
                            Set as default
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </m.div>
        </AnimatePresence>
      </div>

      <ProfileEditModal open={editingProfile} onClose={() => setEditingProfile(false)} />

      <PasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />

      <AddressModal
        modal={addressModal}
        onClose={() => setAddressModal(null)}
        onSubmit={(input, id) => {
          if (id) {
            updateAddress.mutate({ id, ...input })
            push('Address updated')
          } else {
            addAddress.mutate(input)
            push('Address added')
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingAddress)}
        onClose={() => setDeletingAddress(null)}
        onConfirm={() => {
          if (deletingAddress) {
            removeAddress.mutate(deletingAddress.id)
            push('Address removed', 'info')
          }
        }}
        title="Remove address?"
        body={`The "${deletingAddress?.label}" address will be removed from your account.`}
      />

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        body="Your basket and wishlist stay on this device. See you soon."
        confirmLabel="Sign out"
      />
    </PageShell>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border hairline bg-ivory-100/70 p-6">
      <p className="text-xs font-bold tracking-[0.14em] text-forest-900/65 uppercase">{title}</p>
      <p className="mt-2 font-medium text-forest-900">{value}</p>
    </div>
  )
}

function OrdersTab({ orders }: { orders: Order[] | undefined }) {
  return (
    <div className="max-w-3xl rounded-3xl border hairline bg-ivory-100/70 p-7">
      <h2 className="font-display text-2xl font-medium">Order history</h2>
      {!orders ? (
        <p className="mt-6 animate-pulse text-sm text-forest-900/65" role="status">
          Loading orders…
        </p>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <PackageOpen size={26} className="mx-auto text-forest-900/30" strokeWidth={1.5} />
          <p className="mt-4 text-sm text-forest-900/65">
            No orders yet — your first ritual awaits.
          </p>
          <ButtonLink to="/products" variant="primary" size="sm" className="mt-6">
            Browse products
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-forest-900/[0.07]">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/order/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:text-bronze-600"
              >
                <span>
                  <span className="font-mono text-sm font-semibold tracking-wide">{order.id}</span>
                  <span className="ml-3 text-xs text-forest-900/65">
                    {formatDate(order.placedAt)}
                  </span>
                </span>
                <span className="flex items-center gap-4 text-sm">
                  <span className="rounded-full bg-forest-900/[0.06] px-3 py-1 text-xs font-bold">
                    {order.status}
                  </span>
                  <span className="font-bold tabular-nums">{formatPrice(order.total)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProfileEditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: user } = useAuth()
  const updateProfile = useUpdateProfile()
  const push = useToasts((s) => s.push)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (open && user) {
      setName(user.name)
      setPhone(user.phone ?? '')
      setErrors({})
    }
  }, [open, user])

  if (!user) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = {
      name: required(name, 'Name'),
      phone: phone.trim() ? validPhoneIN(phone) : undefined,
    }
    setErrors(next)
    if (next.name || next.phone) return
    updateProfile.mutate({ name: name.trim(), phone: phone.replace(/[\s\-()+]/g, '') || undefined })
    push('Profile updated')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="edit-profile-name"
            className={inputStyles}
          />
          {errors.name && <span className="mt-1.5 block text-xs text-clay-400">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase">
            Phone
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="10-digit mobile"
            data-testid="edit-profile-phone"
            className={inputStyles}
          />
          {errors.phone && (
            <span className="mt-1.5 block text-xs text-clay-400">{errors.phone}</span>
          )}
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-ivory-50/15 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-sage-200/80 uppercase transition-colors hover:border-ivory-50/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-bronze-500 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-forest-950 uppercase transition-colors hover:bg-bronze-400"
          >
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  )
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const changePassword = useChangePassword()
  const push = useToasts((s) => s.push)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (open) {
      setCurrent('')
      setNext('')
      setConfirm('')
      setErrors({})
    }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const found = {
      current: required(current, 'Current password'),
      next: next.length < 8 ? 'Use at least 8 characters' : undefined,
      confirm: next === confirm ? undefined : 'Passwords do not match',
    }
    setErrors(found)
    if (found.current || found.next || found.confirm) return

    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next })
      push('Password changed — other devices were signed out')
      onClose()
    } catch (err) {
      const { message } = fieldErrors(err)
      setErrors({ current: message })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Change password">
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase">
            Current password
          </span>
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            type="password"
            autoComplete="current-password"
            data-testid="current-password"
            className={inputStyles}
          />
          {errors.current && (
            <span className="mt-1.5 block text-xs text-clay-400">{errors.current}</span>
          )}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase">
            New password
          </span>
          <input
            value={next}
            onChange={(e) => setNext(e.target.value)}
            type="password"
            autoComplete="new-password"
            data-testid="new-password"
            className={inputStyles}
          />
          {errors.next && <span className="mt-1.5 block text-xs text-clay-400">{errors.next}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase">
            Confirm new password
          </span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            autoComplete="new-password"
            data-testid="confirm-password"
            className={inputStyles}
          />
          {errors.confirm && (
            <span className="mt-1.5 block text-xs text-clay-400">{errors.confirm}</span>
          )}
        </label>
        <p className="text-xs leading-relaxed text-sage-300/70">
          Changing your password signs you out everywhere else.
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-ivory-50/15 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-sage-200/80 uppercase transition-colors hover:border-ivory-50/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="cursor-pointer rounded-full bg-bronze-500 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-forest-950 uppercase transition-colors hover:bg-bronze-400 disabled:opacity-60"
          >
            {changePassword.isPending ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type AddressInput = Omit<Address, 'id'>

function AddressModal({
  modal,
  onClose,
  onSubmit,
}: {
  modal: { mode: 'add' | 'edit'; address?: Address } | null
  onClose: () => void
  onSubmit: (input: AddressInput, editId?: string) => void
}) {
  const blank = {
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false,
  }
  const [form, setForm] = useState<AddressInput>(blank)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const editingId = modal?.mode === 'edit' ? modal.address?.id : undefined

  useEffect(() => {
    if (!modal) return
    setErrors({})
    if (modal.mode === 'edit' && modal.address) {
      const { id: _id, ...rest } = modal.address
      setForm(rest)
    } else {
      setForm(blank)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal])

  if (!modal) return null

  const set =
    (key: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = {
      label: required(form.label, 'Label'),
      fullName: required(form.fullName, 'Full name'),
      phone: validPhoneIN(form.phone),
      addressLine: required(form.addressLine, 'Address'),
      city: required(form.city, 'City'),
      state: required(form.state, 'State'),
      postalCode: validPostalIN(form.postalCode),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    onSubmit({ ...form, label: form.label.trim(), isDefault: Boolean(form.isDefault) }, editingId)
    onClose()
  }

  const field = (
    key: keyof AddressInput,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-sage-300/70 uppercase">
        {label}
      </span>
      <input
        value={String(form[key] ?? '')}
        onChange={set(key)}
        data-testid={`address-${key}`}
        className={inputStyles}
        {...props}
      />
      {errors[key] && <span className="mt-1.5 block text-xs text-clay-400">{errors[key]}</span>}
    </label>
  )

  return (
    <Modal open onClose={onClose} title={editingId ? 'Edit address' : 'Add address'}>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {field('label', 'Label', { placeholder: 'Home, Studio…', list: 'address-label-options' })}
        <datalist id="address-label-options">
          <option value="Home" />
          <option value="Work" />
          <option value="Other" />
        </datalist>
        {field('fullName', 'Full name', { autoComplete: 'name' })}
        {field('phone', 'Phone', {
          type: 'tel',
          inputMode: 'tel',
          autoComplete: 'tel',
          placeholder: '10-digit mobile',
        })}
        {field('addressLine', 'Address line', { autoComplete: 'street-address' })}
        <div className="grid grid-cols-2 gap-4">
          {field('city', 'City')}
          {field('state', 'State')}
        </div>
        {field('postalCode', 'PIN code', { inputMode: 'numeric', autoComplete: 'postal-code' })}
        <label className="flex cursor-pointer items-center gap-3 pt-1 text-sm text-sage-200/80">
          <input
            type="checkbox"
            checked={Boolean(form.isDefault)}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            data-testid="address-is-default"
            className="size-4 accent-bronze-500"
          />
          Use as default address
        </label>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-ivory-50/15 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-sage-200/80 uppercase transition-colors hover:border-ivory-50/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-bronze-500 px-5 py-2.5 text-xs font-bold tracking-[0.12em] text-forest-950 uppercase transition-colors hover:bg-bronze-400"
          >
            {editingId ? 'Save changes' : 'Add address'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
