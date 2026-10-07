import { startTransition, useEffect, useState } from 'react'
import { PageShell } from './PageShell'
import { HeroSection } from '@/components/sections/HeroSection'
import { OriginSection } from '@/components/sections/OriginSection'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { ProductExperienceSection } from '@/components/sections/ProductExperienceSection'
import { KnowledgeSection } from '@/components/sections/KnowledgeSection'
import { JourneySection } from '@/components/sections/JourneySection'
import { SustainabilitySection } from '@/components/sections/SustainabilitySection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { NewsletterSection } from '@/components/sections/NewsletterSection'
import { useDocumentMeta } from '@/hooks'

export default function HomePage() {
  // The hero is the LCP; the rest of the page renders in a transition right after it paints.
  const [showRest, setShowRest] = useState(false)
  useEffect(() => startTransition(() => setShowRest(true)), [])

  useDocumentMeta(
    'ARANYA — Ancient Wisdom. Naturally Reimagined.',
    'Premium herbal wellness rooted in the Ayurvedic traditions of India. Thoughtfully sourced botanicals, mindful rituals, modern care.',
  )

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'ld-org'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Aranya Botanicals',
      slogan: 'Ancient Wisdom. Naturally Reimagined.',
      description:
        'Premium herbal wellness products inspired by the Ayurvedic traditions of India.',
    })
    document.head.appendChild(script)
    return () => {
      document.getElementById('ld-org')?.remove()
    }
  }, [])

  return (
    <PageShell>
      <HeroSection />
      {showRest && (
        <>
          <OriginSection />
          <FeaturedProducts />
          <ProductExperienceSection />
          <KnowledgeSection />
          <JourneySection />
          <SustainabilitySection />
          <TestimonialsSection />
          <NewsletterSection />
        </>
      )}
    </PageShell>
  )
}
