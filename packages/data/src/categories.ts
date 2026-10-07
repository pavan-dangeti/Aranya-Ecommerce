import type { Category } from '@aranya/shared'

export const categories: Category[] = [
  {
    id: 'herbal-supplements',
    name: 'Herbal Supplements',
    tagline: 'Single-herb and blended formulations in their most considered form.',
  },
  {
    id: 'skin-care',
    name: 'Skin Care',
    tagline: 'Botanical care rooted in classical Ayurvedic skin rituals.',
  },
  {
    id: 'hair-care',
    name: 'Hair Care',
    tagline: 'Traditional oiling and rinsing practices, reimagined for modern weeks.',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    tagline: 'Everyday blends that anchor a slower, more intentional routine.',
  },
  {
    id: 'herbal-drinks',
    name: 'Herbal Drinks',
    tagline: 'Elixirs and tisanes to sip through the rhythm of your day.',
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    tagline: 'Gentle daily essentials made with plant-derived care.',
  },
]

export const categoryName = (id: string): string => categories.find((c) => c.id === id)?.name ?? id
