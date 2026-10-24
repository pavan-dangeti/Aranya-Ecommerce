import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { LogoMark } from './Logo'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/products' },
      { label: 'Best Sellers', to: '/products?sort=rating' },
      { label: 'New Arrivals', to: '/products?sort=newest' },
      { label: 'Herbal Supplements', to: '/products?cat=herbal-supplements' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Our Story', to: '/story' },
      { label: 'Ingredients', to: '/ingredients' },
      { label: 'Ayurveda', to: '/journal/what-is-ayurveda' },
      { label: 'Journal', to: '/journal' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact', to: '/support/contact' },
      { label: 'Shipping', to: '/support/shipping' },
      { label: 'Returns', to: '/support/returns' },
      { label: 'FAQ', to: '/support/faq' },
    ],
  },
]

// lucide-react 1.x dropped brand marks, so these are drawn on lucide's grid and stroke.
function brandIcon(paths: ReactNode) {
  return function BrandIcon({
    size = 24,
    strokeWidth = 2,
  }: {
    size?: number
    strokeWidth?: number
  }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths}
      </svg>
    )
  }
}

const Instagram = brandIcon(
  <>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <path d="M17.5 6.5h.01" />
  </>,
)

const Youtube = brandIcon(
  <>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </>,
)

const Linkedin = brandIcon(
  <>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </>,
)

const SOCIALS = [
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
]

export function Footer() {
  return (
    <footer className="bg-forest-950 text-ivory-50">
      <div className="shell grid gap-14 py-20 md:grid-cols-[1.3fr_repeat(3,1fr)] md:gap-8 lg:py-24">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-8 text-bronze-400" />
            <span className="font-display text-xl font-semibold tracking-[0.32em]">ARANYA</span>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-sage-300/70">
            Thoughtfully crafted herbal wellness from India's living traditions. Small batches,
            honest sourcing, rituals worth keeping.
          </p>
          <div className="mt-7 flex gap-2.5">
            {SOCIALS.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Aranya on ${label}`}
                className="grid size-10 place-items-center rounded-full border border-ivory-50/15 text-sage-300 transition-all hover:border-bronze-400/60 hover:text-bronze-400"
              >
                <Icon size={17} strokeWidth={1.7} />
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="eyebrow mb-5 text-bronze-400">{col.title}</h3>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="link-underline text-sm text-ivory-50/75 transition-colors hover:text-ivory-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ivory-50/[0.08]">
        <div className="shell flex flex-col items-center justify-between gap-4 py-7 sm:flex-row">
          <p className="text-xs text-sage-300/70">
            © {new Date().getFullYear()} Aranya Botanicals Pvt. Ltd. — a fictional demo brand.
            Bengaluru, India
          </p>
          <div className="flex gap-7">
            <Link
              to="/support/privacy"
              className="text-xs text-sage-300/70 transition-colors hover:text-ivory-50"
            >
              Privacy Policy
            </Link>
            <Link
              to="/support/terms"
              className="text-xs text-sage-300/70 transition-colors hover:text-ivory-50"
            >
              Terms
            </Link>
            <Link
              to="/support/refund"
              className="text-xs text-sage-300/70 transition-colors hover:text-ivory-50"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
