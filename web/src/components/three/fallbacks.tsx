import { m } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks'
import { EASE_ORGANIC } from '@/utils/motion'

/** 2D stand-in for the hero 3D scene — used when WebGL is unavailable. */
export function HeroFallback() {
  const reduced = usePrefersReducedMotion()
  return (
    <div className="absolute inset-0 overflow-hidden bg-forest-950" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,#1b3527_0%,transparent_70%)]" />
      <m.div
        animate={reduced ? undefined : { scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 size-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#c29a64_0%,rgba(194,154,100,0.12)_45%,transparent_70%)] blur-2xl"
      />
      <div className="absolute top-1/2 left-1/2 size-[30vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#44684c,#14291e_65%,#0b1811)] shadow-[inset_-18px_-24px_60px_rgba(0,0,0,0.55),0_40px_120px_rgba(194,154,100,0.15)]" />
      {[
        { top: '22%', left: '18%', size: 26, delay: 0 },
        { top: '64%', left: '24%', size: 18, delay: 1.4 },
        { top: '28%', left: '76%', size: 20, delay: 0.8 },
        { top: '68%', left: '72%', size: 30, delay: 2 },
        { top: '48%', left: '84%', size: 14, delay: 1 },
        { top: '44%', left: '10%', size: 16, delay: 2.6 },
      ].map((leaf, i) => (
        <m.svg
          key={i}
          viewBox="0 0 32 32"
          className="absolute text-sage-400/35"
          style={{ top: leaf.top, left: leaf.left, width: leaf.size }}
          animate={reduced ? undefined : { y: [-8, 8, -8], rotate: [-6, 6, -6] }}
          transition={{ duration: 7 + i, repeat: Infinity, ease: EASE_ORGANIC }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 27V13" />
          <path d="M16 17c0-6 3.6-9.6 9-10.5C24.4 12 21.4 15.6 16 17Z" />
          <path d="M16 20c0-4.6-2.6-7.4-6.8-8.3C9.9 16 12.4 18.8 16 20Z" opacity="0.55" />
        </m.svg>
      ))}
    </div>
  )
}

export function ProductSceneFallback({ glass, accent }: { glass: string; accent: string }) {
  return (
    <div
      className="relative grid h-full w-full place-items-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute size-[70%] max-w-md rounded-full bg-[radial-gradient(circle,rgba(194,154,100,0.14),transparent_70%)]" />
      <svg viewBox="0 0 200 320" className="h-[78%] drop-shadow-[0_36px_48px_rgba(4,18,10,0.5)]">
        <defs>
          <linearGradient id={`fb-g-${glass.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={glass} stopOpacity="0.75" />
            <stop offset="0.42" stopColor={glass} stopOpacity="1.25" />
            <stop offset="1" stopColor={glass} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect x="82" y="8" width="36" height="18" rx="4" fill="#a9824e" />
        <rect x="86" y="26" width="28" height="10" fill="#6e5432" />
        <path
          d="M62 62 C62 46 80 38 100 38 C120 38 138 46 138 62 L138 296 C138 308 128 314 116 314 L84 314 C72 314 62 308 62 296 Z"
          fill={`url(#fb-g-${glass.replace('#', '')})`}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
        <rect x="74" y="150" width="52" height="96" rx="4" fill="#f4efe3" opacity="0.94" />
        <rect
          x="77"
          y="153"
          width="46"
          height="90"
          rx="3"
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="1"
        />
        <text
          x="100"
          y="176"
          textAnchor="middle"
          fontFamily="'Manrope Variable', sans-serif"
          fontSize="8"
          fontWeight="700"
          letterSpacing="2.4"
          fill="#8f6b3f"
        >
          ARANYA
        </text>
        <line
          x1="88"
          y1="184"
          x2="112"
          y2="184"
          stroke="#8f6b3f"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <ellipse cx="82" cy="110" rx="5" ry="34" fill="#ffffff" opacity="0.18" />
        <ellipse cx="100" cy="322" rx="58" ry="7" fill="#000000" opacity="0.25" />
      </svg>
    </div>
  )
}
