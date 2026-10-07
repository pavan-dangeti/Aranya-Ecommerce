import { useState } from 'react'
import { m } from 'framer-motion'
import { Leaf, MailCheck } from 'lucide-react'
import { validEmail, required } from '@/utils/validate'
import { Button } from '@/components/ui/Button'
import { fadeUp, viewportOnce } from '@/utils/motion'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [done, setDone] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = required(email, 'Email') ?? validEmail(email)
    setError(err)
    if (err) return
    setDone(true)
  }

  return (
    <section className="bg-ivory-50 py-28 lg:py-32" aria-labelledby="newsletter-heading">
      <div className="shell">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] bg-forest-900 px-8 py-16 text-center sm:px-16"
        >
          <div
            aria-hidden="true"
            className="absolute -top-20 -left-20 size-56 rounded-full bg-[radial-gradient(circle,rgba(194,154,100,0.18),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 -bottom-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(93,130,102,0.22),transparent_70%)]"
          />

          {done ? (
            <m.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              role="status"
            >
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-bronze-500/15 text-bronze-400">
                <MailCheck size={24} strokeWidth={1.6} />
              </span>
              <h2 className="mt-6 font-display text-3xl font-medium text-ivory-50">
                Welcome to the grove
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-sage-200/70">
                A first letter is on its way to {email}. Until then — the kettle is already on.
              </p>
            </m.div>
          ) : (
            <>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-bronze-500/15 text-bronze-400">
                <Leaf size={21} strokeWidth={1.6} />
              </span>
              <h2
                id="newsletter-heading"
                className="mt-5 font-display text-3xl leading-tight font-medium text-balance text-ivory-50 sm:text-4xl"
              >
                Bring a little more nature into your everyday.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-sage-200/65">
                One unhurried letter a month — rituals, harvest notes, and early access to small
                batches. No noise, ever.
              </p>

              <form
                onSubmit={submit}
                noValidate
                className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className="h-13 w-full rounded-full border border-ivory-50/15 bg-ivory-50/[0.06] px-6 text-sm text-ivory-50 outline-none transition-all placeholder:text-sage-300/40 focus:border-bronze-400/60 focus:bg-ivory-50/[0.09]"
                  />
                </div>
                <Button type="submit" variant="bronze" magnetic>
                  Join the Ritual
                </Button>
              </form>
              {error && (
                <p
                  id="newsletter-error"
                  role="alert"
                  className="mt-3 text-xs font-semibold text-clay-500"
                >
                  {error}
                </p>
              )}
            </>
          )}
        </m.div>
      </div>
    </section>
  )
}
