import type { Ingredient } from '@aranya/shared'

export const ingredients: Ingredient[] = [
  {
    id: 'ashwagandha',
    name: 'Ashwagandha',
    sanskritName: 'अश्वगन्धा',
    latinName: 'Withania somnifera',
    origin: 'Sirohi, Rajasthan',
    traditionalCategory: 'Adaptogen · Rasayana',
    description:
      'The root of winter. Ashwagandha has been part of Indian evening routines for centuries, traditionally taken as a rasayana — a rejuvenative — often stirred into warm milk before sleep.',
    foundIn: ['ashwagandha-root-capsules'],
    palette: { deep: '#44684c', soft: '#8aa48c', accent: '#c29a64' },
  },
  {
    id: 'neem',
    name: 'Neem',
    sanskritName: 'निम्ब',
    latinName: 'Azadirachta indica',
    origin: 'Deccan plateau',
    traditionalCategory: 'Skin & purification traditions',
    description:
      'Called sarva roga nivarini — "the reliever of all ailments" — in folk tradition. Every part of the neem tree finds a place in Indian daily life, most famously in skin care and morning routines.',
    foundIn: ['neem-care-serum'],
    palette: { deep: '#31402c', soft: '#55663d', accent: '#a8bcab' },
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    sanskritName: 'हरिद्रा',
    latinName: 'Curcuma longa',
    origin: 'Lakadong, Meghalaya',
    traditionalCategory: 'Daily spice · Golden milk',
    description:
      'No herb is more woven into Indian life. Turmeric marks thresholds and weddings as much as it flavours milk; the Lakadong variety is prized for its unusually deep colour.',
    foundIn: ['turmeric-complex'],
    palette: { deep: '#8a5a1e', soft: '#c98a2d', accent: '#a85a38' },
  },
  {
    id: 'tulsi',
    name: 'Tulsi',
    sanskritName: 'तुलसी',
    latinName: 'Ocimum sanctum',
    origin: 'Eastern Uttar Pradesh',
    traditionalCategory: 'Daily infusion · Courtyard herb',
    description:
      'Grown in courtyards across India and worshipped each morning, tulsi is the household infusion of the subcontinent — clove-sweet, calming, endlessly drinkable.',
    foundIn: ['tulsi-elixir'],
    palette: { deep: '#22392b', soft: '#5d8266', accent: '#8aa48c' },
  },
  {
    id: 'amla',
    name: 'Amla',
    sanskritName: 'आमलकी',
    latinName: 'Emblica officinalis',
    origin: 'Vindhya hills, Madhya Pradesh',
    traditionalCategory: 'Nourishing fruit · Chyawanprash base',
    description:
      'The sour green fruit of autumn, valued in Ayurveda as one of the great nourishing fruits. It anchors chyawanprash and triphala, and is eaten fresh, dried, or powdered.',
    foundIn: ['amla-wellness-blend', 'triphala-tablets'],
    palette: { deep: '#6b7a4a', soft: '#93a45e', accent: '#5d8266' },
  },
  {
    id: 'brahmi',
    name: 'Brahmi',
    sanskritName: 'ब्राह्मी',
    latinName: 'Bacopa monnieri',
    origin: 'Kuttanad backwaters, Kerala',
    traditionalCategory: 'Meditation companion · Mind herbs',
    description:
      'A creeping water-herb named for Brahma himself. Brahmi grows along slow backwaters and has kept company with students and meditators for hundreds of years.',
    foundIn: ['brahmi-botanical'],
    palette: { deep: '#2e4a38', soft: '#7c967f', accent: '#a9824e' },
  },
]
