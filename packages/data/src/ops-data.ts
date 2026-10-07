import type { OrderStatus, PaymentMethod } from '@aranya/shared'

export interface DemoCustomer {
  name: string
  email: string
  city: string
  memberSince: string
}

export const demoCustomers: DemoCustomer[] = [
  {
    name: 'Ishita Roy',
    email: 'ishita.roy@example.com',
    city: 'Bengaluru',
    memberSince: '2025-06-15',
  },
  {
    name: 'Karthik Subramanian',
    email: 'k.subramanian@example.com',
    city: 'Chennai',
    memberSince: '2025-08-02',
  },
  {
    name: 'Nandini Pillai',
    email: 'nandini.p@example.com',
    city: 'Mumbai',
    memberSince: '2025-07-19',
  },
  {
    name: 'Arjun Bedi',
    email: 'arjun.bedi@example.com',
    city: 'Gurugram',
    memberSince: '2025-09-30',
  },
  {
    name: 'Shreya Mohan',
    email: 'shreya.m@example.com',
    city: 'Coimbatore',
    memberSince: '2025-10-11',
  },
  {
    name: 'Rhea Fernandes',
    email: 'rhea.f@example.com',
    city: 'Panaji',
    memberSince: '2025-05-28',
  },
  {
    name: 'Devika Sharma',
    email: 'devika.sharma@example.com',
    city: 'Jaipur',
    memberSince: '2025-11-09',
  },
  {
    name: 'Farhan Qureshi',
    email: 'farhan.q@example.com',
    city: 'Hyderabad',
    memberSince: '2026-01-22',
  },
  { name: 'Meera Kulkarni', email: 'meera.k@example.com', city: 'Pune', memberSince: '2025-04-03' },
  {
    name: 'Rohan Iyer',
    email: 'rohan.iyer@example.com',
    city: 'Chennai',
    memberSince: '2026-02-14',
  },
  {
    name: 'Tanvi Deshpande',
    email: 'tanvi.d@example.com',
    city: 'Mumbai',
    memberSince: '2025-12-05',
  },
  {
    name: 'Nikhil Verma',
    email: 'nikhil.verma@example.com',
    city: 'Gurugram',
    memberSince: '2026-03-30',
  },
]

export interface DemoOrderSpec {
  customer: number
  items: Array<[string, number]>
  status: OrderStatus
  daysAgo: number
  payment: PaymentMethod
}

/** Deterministic history so the admin console and charts have something real to show. */
export const demoOrderSpecs: DemoOrderSpec[] = [
  {
    customer: 0,
    items: [
      ['arn-012', 1],
      ['arn-003', 2],
    ],
    status: 'Shipped',
    daysAgo: 3,
    payment: 'upi',
  },
  { customer: 2, items: [['arn-008', 2]], status: 'Processing', daysAgo: 1, payment: 'card' },
  { customer: 10, items: [['arn-011', 3]], status: 'Pending', daysAgo: 0, payment: 'upi' },
  {
    customer: 3,
    items: [
      ['arn-001', 1],
      ['arn-002', 1],
    ],
    status: 'Pending',
    daysAgo: 0,
    payment: 'cod',
  },
  { customer: 4, items: [['arn-006', 1]], status: 'Delivered', daysAgo: 21, payment: 'card' },
  {
    customer: 5,
    items: [
      ['arn-012', 1],
      ['arn-007', 1],
    ],
    status: 'Delivered',
    daysAgo: 34,
    payment: 'card',
  },
  {
    customer: 8,
    items: [
      ['arn-001', 2],
      ['arn-013', 1],
    ],
    status: 'Delivered',
    daysAgo: 47,
    payment: 'upi',
  },
  {
    customer: 1,
    items: [
      ['arn-003', 1],
      ['arn-011', 1],
    ],
    status: 'Delivered',
    daysAgo: 52,
    payment: 'upi',
  },
  {
    customer: 6,
    items: [
      ['arn-008', 1],
      ['arn-009', 1],
    ],
    status: 'Cancelled',
    daysAgo: 9,
    payment: 'cod',
  },
  { customer: 9, items: [['arn-004', 1]], status: 'Delivered', daysAgo: 66, payment: 'upi' },
  { customer: 11, items: [['arn-011', 1]], status: 'Delivered', daysAgo: 71, payment: 'card' },
  {
    customer: 0,
    items: [
      ['arn-007', 1],
      ['arn-010', 1],
    ],
    status: 'Delivered',
    daysAgo: 84,
    payment: 'card',
  },
  { customer: 2, items: [['arn-014', 2]], status: 'Delivered', daysAgo: 92, payment: 'upi' },
  { customer: 5, items: [['arn-012', 1]], status: 'Cancelled', daysAgo: 96, payment: 'card' },
  {
    customer: 8,
    items: [
      ['arn-002', 2],
      ['arn-013', 1],
    ],
    status: 'Delivered',
    daysAgo: 103,
    payment: 'upi',
  },
  { customer: 3, items: [['arn-005', 1]], status: 'Delivered', daysAgo: 118, payment: 'card' },
  {
    customer: 6,
    items: [
      ['arn-010', 1],
      ['arn-014', 1],
    ],
    status: 'Delivered',
    daysAgo: 126,
    payment: 'upi',
  },
  { customer: 1, items: [['arn-008', 2]], status: 'Delivered', daysAgo: 139, payment: 'upi' },
  {
    customer: 9,
    items: [
      ['arn-011', 2],
      ['arn-003', 1],
    ],
    status: 'Delivered',
    daysAgo: 147,
    payment: 'upi',
  },
  {
    customer: 10,
    items: [
      ['arn-006', 1],
      ['arn-012', 1],
    ],
    status: 'Delivered',
    daysAgo: 161,
    payment: 'card',
  },
  { customer: 4, items: [['arn-001', 1]], status: 'Cancelled', daysAgo: 168, payment: 'cod' },
  { customer: 0, items: [['arn-003', 3]], status: 'Delivered', daysAgo: 180, payment: 'upi' },
]

export interface DemoReviewSpec {
  productId: string
  author: string
  location: string
  rating: number
  title: string
  body: string
  status: 'Pending' | 'Approved' | 'Rejected'
  daysAgo: number
}

export const demoReviewSpecs: DemoReviewSpec[] = [
  {
    productId: 'arn-001',
    author: 'ananya.r@example.com',
    location: 'Pune',
    rating: 5,
    title: 'Tastes like a proper kashaya',
    body: 'Brewed it every morning for three weeks. The jeera and tulsi note is very close to what my grandmother made, and the digestion settling is real after a week.',
    status: 'Pending',
    daysAgo: 1,
  },
  {
    productId: 'arn-004',
    author: 'rahul.s@example.com',
    location: 'Hyderabad',
    rating: 2,
    title: 'Bottle leaked in transit',
    body: 'The dropper cap was loose when it arrived so half the oil leaked into the box. Product itself seems fine but I am not paying premium prices for a leaky bottle.',
    status: 'Pending',
    daysAgo: 2,
  },
  {
    productId: 'arn-007',
    author: 'simran.k@example.com',
    location: 'Delhi',
    rating: 4,
    title: 'Thinner than I expected',
    body: 'Good for daily use and the scent is genuinely calming, but if you have very long hair you will get through the 100ml faster than the label suggests. Still repurchasing.',
    status: 'Rejected',
    daysAgo: 6,
  },
  {
    productId: 'arn-011',
    author: 'karthik.v@example.com',
    location: 'Bengaluru',
    rating: 5,
    title: 'Replaced my second coffee',
    body: 'Three weeks in and I no longer need the 4pm coffee. The ashwagandha is doing something. Only note is the tin is smaller than it looks in the photos.',
    status: 'Pending',
    daysAgo: 0,
  },
]
