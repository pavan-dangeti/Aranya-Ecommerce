export type CategoryId =
  'herbal-supplements' | 'skin-care' | 'hair-care' | 'wellness' | 'herbal-drinks' | 'personal-care'

interface ProductIngredient {
  name: string
  note: string
}

export interface Product {
  id: string
  name: string
  slug: string
  category: CategoryId
  description: string
  shortDescription: string
  price: number
  compareAtPrice?: number
  rating: number
  reviewCount: number
  ingredients: ProductIngredient[]
  benefits: string[]
  usage: string
  origin: string
  stock: number
  tags: string[]
  featured?: boolean
  isNew?: boolean
  visual: {
    form: BottleForm
    glass: string
    liquid: string
    label: string
    accent: string
  }
}

export type BottleForm = 'dropper' | 'jar' | 'pump' | 'flask' | 'tin' | 'tube'

export interface Ingredient {
  id: string
  name: string
  sanskritName: string
  latinName: string
  origin: string
  traditionalCategory: string
  description: string
  foundIn: string[]
  palette: { deep: string; soft: string; accent: string }
}

export interface OrderAddress {
  fullName: string
  email: string
  phone: string
  addressLine: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type PaymentMethod = 'upi' | 'card' | 'cod'

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'

interface OrderItem {
  productId: string
  name: string
  qty: number
  price: number
}

export interface Order {
  id: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  address: OrderAddress
  paymentMethod: PaymentMethod
  status: OrderStatus
  placedAt: string
  estimatedDelivery: string
}

export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  addressLine: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

export type CustomerStatus = 'Active' | 'VIP' | 'Dormant'

export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected'

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'

export interface PagedProducts {
  items: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
