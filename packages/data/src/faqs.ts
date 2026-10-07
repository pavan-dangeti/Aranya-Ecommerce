import { faqSchema, type z } from '@aranya/shared'

type Faq = z.infer<typeof faqSchema>

export const faqs: Faq[] = [
  {
    question: 'Are Aranya products certified?',
    answer:
      'Our partner farms and facilities follow recognised good-manufacturing practices, and each batch is released only after internal quality checks. Detailed documentation for the specific product you purchase can be requested from our support team.',
  },
  {
    question: 'How long do herbal products stay fresh?',
    answer:
      'Every product carries a batch number and best-before date on its base. Most blends are happiest within 12 months of opening; oils within 6–9 months stored away from sunlight. We produce in small batches precisely so nothing sits in a warehouse losing itself.',
  },
  {
    question: 'Do you make medical claims about your herbs?',
    answer:
      'No. Where we describe traditional uses — "traditionally used in Ayurveda", "part of classical routines" — we are describing historical practice, not promising outcomes. Herbs are companions to a healthy life, not replacements for medical care. Please consult a qualified practitioner for health conditions.',
  },
  {
    question: 'Are the products vegetarian or vegan?',
    answer:
      'Nearly all are vegan. Two exceptions use beeswax (Rose & Sandal Cream) and honey-adjacent ingredients in classical preparations, and these are marked vegetarian on their product pages. Every ingredient list is printed in full.',
  },
  {
    question: 'Where do you ship?',
    answer:
      'Across India, with complimentary shipping on orders above ₹999. International shipping to select countries is in pilot — write to us with your city and we will confirm availability.',
  },
  {
    question: 'Can I return an opened product?',
    answer:
      'Unopened products can be returned within 14 days. If something arrives damaged or incorrect, we replace it regardless of packaging state — just photograph the issue and write to care@aranya.in within 48 hours of delivery.',
  },
]
