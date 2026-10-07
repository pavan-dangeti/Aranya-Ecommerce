import { useState } from 'react'
import { useParams } from 'react-router'
import { m } from 'framer-motion'
import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react'
import { useFaqs } from '@/hooks/useCatalog'
import { validEmail } from '@/utils/validate'
import { PageShell } from './PageShell'
import { Button } from '@/components/ui/Button'
import { useDocumentMeta } from '@/hooks'
import { AnimatePresence } from 'framer-motion'
import { EASE_ORGANIC } from '@/utils/motion'

interface InfoSection {
  heading: string
  body: string[]
}

const CONTENT: Record<string, { title: string; intro: string; sections: InfoSection[] }> = {
  contact: {
    title: 'Contact',
    intro:
      'Questions about an order, a herb, or a ritual? Our small care team replies within one working day.',
    sections: [],
  },
  shipping: {
    title: 'Shipping',
    intro:
      'Dispatch happens within 24 hours on working days; transit times below are estimates for Indian addresses.',
    sections: [
      {
        heading: 'Rates & timelines',
        body: [
          'Complimentary shipping applies to all orders above ₹999. Below that, a flat ₹79 covers packaging and courier.',
          'Metro cities typically receive parcels in 2–4 working days; the rest of India in 4–7. Oils and tins ship in cushioned kraft wraps — no plastic tape.',
        ],
      },
      {
        heading: 'International pilot',
        body: [
          'We ship to a handful of countries in a limited pilot. Write to care@aranya.in with your city and we will confirm availability and rates.',
        ],
      },
      {
        heading: 'Monsoon note',
        body: [
          'During heavy-rain weeks some routes slow down by a day or two. Your tracking link always carries the live estimate.',
        ],
      },
    ],
  },
  returns: {
    title: 'Returns & Exchanges',
    intro:
      'Herbal preparations are personal — but if something is wrong on our side, we make it right quickly.',
    sections: [
      {
        heading: 'Unopened products',
        body: [
          'Return any unopened item within 14 days of delivery for a full refund to your original payment method.',
        ],
      },
      {
        heading: 'Damaged or incorrect deliveries',
        body: [
          'If a parcel arrives damaged or contains the wrong item, photograph it and write to care@aranya.in within 48 hours. We replace it at our cost regardless of packaging state.',
        ],
      },
      {
        heading: 'Opened products',
        body: [
          'For hygiene reasons opened oils, creams and consumables cannot be resold and are not eligible for return — unless faulty, which we treat as above.',
        ],
      },
    ],
  },
  faq: {
    title: 'FAQ',
    intro: 'The questions that reach us most often, answered plainly.',
    sections: [],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'We keep the data we need to run your account and nothing more. Here is exactly what that means.',
    sections: [
      {
        heading: 'What we store on our servers',
        body: [
          'Your account (name, email, phone), your saved addresses, your wishlist and your order history. Your password is hashed with Argon2id before it is stored — we never hold the readable version.',
        ],
      },
      {
        heading: 'What stays in your browser',
        body: [
          "If you shop without signing in, your basket is kept in this browser's local storage so it survives a refresh. That is the only thing we store locally, and clearing your site data removes it.",
        ],
      },
      {
        heading: 'How your session works',
        body: [
          'Signing in returns a short-lived access token held in memory only — never written to storage. The longer-lived refresh token is an httpOnly cookie that JavaScript cannot read, is scoped to the authentication routes, and is rotated on every use. If a used refresh token is presented again, the whole session family is revoked.',
        ],
      },
      {
        heading: 'What is never collected',
        body: [
          'No card details are ever requested or accepted. No analytics beacons, advertising identifiers, or third-party trackers run on this build.',
        ],
      },
      {
        heading: 'Your controls',
        body: [
          'You can edit your name and phone, change your password and delete saved addresses at any time from your account. Changing your password signs every other device out.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro: 'Ground rules for using this storefront.',
    sections: [
      {
        heading: 'Nature of this site',
        body: [
          'Aranya is a fictional demonstration brand built for design and engineering review. Products, reviews, customers and prices are illustrative.',
        ],
      },
      {
        heading: 'No medical advice',
        body: [
          'Content describing traditional uses of herbs reflects recorded practice for cultural and educational context. It is not medical advice; consult a qualified practitioner for health decisions.',
        ],
      },
      {
        heading: 'Orders',
        body: [
          'Checkout is simulated end-to-end. No payment is processed and nothing ships. Your order is recorded against your account so you can follow it, but no goods will be dispatched.',
        ],
      },
    ],
  },
  refund: {
    title: 'Refund Policy',
    intro: 'How refunds would work when this storefront goes live.',
    sections: [
      {
        heading: 'Eligible refunds',
        body: [
          'Unopened products returned within 14 days are refunded in full to the original payment method within 5–7 working days of inspection at our facility.',
        ],
      },
      {
        heading: 'Damaged deliveries',
        body: [
          'Damaged-item claims approved under our Returns policy receive either an immediate replacement or a full refund including shipping, at your choice.',
        ],
      },
      {
        heading: 'About checkout',
        body: [
          'Because no money changes hands in this demo, refunds are illustrative only — nothing is charged to begin with.',
        ],
      },
    ],
  },
}

export default function InfoPage() {
  const { topic = '' } = useParams<{ topic: string }>()
  const content = CONTENT[topic]
  useDocumentMeta(content ? `${content.title} — ARANYA` : 'ARANYA')

  if (!content) return <InfoNotFound />

  return (
    <PageShell className="bg-ivory-50">
      <header className="border-b hairline bg-gradient-to-b from-ivory-100 to-ivory-50 pt-36 pb-14 text-center">
        <div className="shell">
          <p className="eyebrow text-bronze-700">Support</p>
          <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">{content.title}</h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-forest-900/65">
            {content.intro}
          </p>
        </div>
      </header>

      <div className="shell max-w-3xl py-16 pb-28">
        {topic === 'contact' && <ContactPanel />}
        {topic === 'faq' ? (
          <FaqList />
        ) : (
          content.sections.map((section) => (
            <section key={section.heading} className="mt-12 first:mt-0">
              <h2 className="font-display text-2xl font-medium">{section.heading}</h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="mt-4 leading-[1.85] text-forest-900/70">
                  {paragraph}
                </p>
              ))}
            </section>
          ))
        )}
      </div>
    </PageShell>
  )
}

function FaqList() {
  const { data: faqs = [] } = useFaqs()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <ul className="mt-2 divide-y divide-forest-900/[0.08] rounded-3xl border hairline bg-ivory-100/60">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <li key={faq.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-7 py-6 text-left"
            >
              <span className="text-[15px] font-semibold">{faq.question}</span>
              <ChevronDown
                size={17}
                className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_ORGANIC }}
                  className="overflow-hidden"
                >
                  <p className="px-7 pb-6 leading-relaxed text-forest-900/65">{faq.answer}</p>
                </m.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}

function ContactPanel() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Tell us your name')
    const emailError = validEmail(form.email)
    if (emailError) return setError(emailError)
    if (form.message.trim().length < 10) return setError('Give us a little more detail')
    setError(null)
    setSent(true)
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_280px]">
      {sent ? (
        <div className="rounded-3xl border border-moss-400/40 bg-moss-600/[0.07] p-8" role="status">
          <h2 className="font-display text-2xl font-medium">Message received</h2>
          <p className="mt-3 leading-relaxed text-forest-900/65">
            Thank you, {form.name.split(' ')[0]} — the care team will write back to{' '}
            <strong>{form.email}</strong> within one working day.
            <span className="mt-2 block text-xs text-forest-900/65">
              This demo build has no mailbox behind it, so nothing is actually delivered.
            </span>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-forest-900/65 uppercase">
              Name
            </span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
              className="h-13 w-full rounded-xl border hairline bg-white/50 px-4 text-sm outline-none focus:border-bronze-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-forest-900/65 uppercase">
              Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              className="h-13 w-full rounded-xl border hairline bg-white/50 px-4 text-sm outline-none focus:border-bronze-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold tracking-[0.12em] text-forest-900/65 uppercase">
              Message
            </span>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full resize-none rounded-xl border hairline bg-white/50 px-4 py-3 text-sm outline-none focus:border-bronze-500"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs font-semibold text-clay-600">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" magnetic>
            Send message
          </Button>
        </form>
      )}

      <aside className="space-y-5 self-start rounded-3xl border hairline bg-ivory-100/70 p-7 text-sm">
        <p className="eyebrow text-forest-900/65">Reach us</p>
        <p className="flex items-start gap-3">
          <Mail size={15} className="mt-0.5 shrink-0 text-moss-600" /> care@aranya.in
        </p>
        <p className="flex items-start gap-3">
          <Phone size={15} className="mt-0.5 shrink-0 text-moss-600" /> +91 (80) 4718 2200, Mon–Sat
        </p>
        <p className="flex items-start gap-3">
          <MapPin size={15} className="mt-0.5 shrink-0 text-moss-600" /> Aranya Botanicals,
          Indiranagar, Bengaluru 560038
        </p>
      </aside>
    </div>
  )
}

function InfoNotFound() {
  return (
    <PageShell className="bg-ivory-50">
      <div className="shell grid min-h-[60vh] place-items-center pt-24 pb-24 text-center">
        <div>
          <h1 className="font-display text-4xl font-medium">That page isn't in the grove</h1>
          <a
            href="/support/contact"
            className="mt-6 inline-block cursor-pointer rounded-full bg-forest-900 px-7 py-3.5 text-xs font-bold tracking-[0.14em] text-ivory-50 uppercase"
          >
            Contact support
          </a>
        </div>
      </div>
    </PageShell>
  )
}
