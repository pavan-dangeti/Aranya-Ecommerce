import { m } from 'framer-motion'
import { PageShell } from './PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { useDocumentMeta } from '@/hooks'

export default function NotFoundPage() {
  useDocumentMeta('Not Found — ARANYA')
  return (
    <PageShell className="bg-forest-950">
      <div className="relative grid min-h-screen place-items-center overflow-hidden px-6 text-center text-ivory-50">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#14291e_0%,transparent_65%)]"
        />
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <p className="font-display text-[22vw] leading-none font-medium tracking-tight text-bronze-500/15 select-none sm:text-[12rem]">
            404
          </p>
          <h1 className="-mt-6 font-display text-3xl font-medium sm:text-4xl">
            This path doesn't grow here
          </h1>
          <p className="mx-auto mt-4 max-w-sm leading-relaxed text-sage-300/70">
            The page you're after has wandered off the trail. Let's walk you back to the grove.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink to="/" variant="bronze" magnetic>
              Back home
            </ButtonLink>
            <ButtonLink to="/products" variant="outlineLight">
              Browse products
            </ButtonLink>
          </div>
        </m.div>
      </div>
    </PageShell>
  )
}
