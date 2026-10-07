import { useId } from 'react'
import type { BottleForm } from '@/types'
import { shade } from '@/utils/color'
import { cn } from '@/utils/cn'

interface ProductVisualProps {
  name: string
  form: BottleForm
  glass: string
  liquid: string
  accent: string
  className?: string
  backdrop?: boolean
}

export function ProductVisual({
  name,
  form,
  glass,
  liquid,
  accent,
  className,
  backdrop = true,
}: ProductVisualProps) {
  const uid = useId().replace(/[:]/g, '')
  const gGlass = `glass-${uid}`
  const gLiquid = `liquid-${uid}`
  const gMetal = `metal-${uid}`
  const gSheen = `sheen-${uid}`
  const gLabel = `label-${uid}`
  const clipBody = `clip-${uid}`
  const blurShadow = `blur-${uid}`

  const dark = shade(glass, -0.35)
  const mid = shade(glass, 0.12)
  const light = shade(glass, 0.42)
  const liquidDark = shade(liquid, -0.25)
  const metalA = '#6e5432'
  const metalB = '#c8a468'

  return (
    <svg
      viewBox="0 0 320 400"
      role="img"
      aria-label={`${name} — ARANYA botanical packaging`}
      className={cn('h-auto w-full', className)}
    >
      <defs>
        <linearGradient id={gGlass} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dark} />
          <stop offset="0.14" stopColor={mid} />
          <stop offset="0.42" stopColor={light} />
          <stop offset="0.62" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={gLiquid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade(liquidDark, -0.15)} />
          <stop offset="0.45" stopColor={shade(liquid, 0.18)} />
          <stop offset="1" stopColor={liquidDark} />
        </linearGradient>
        <linearGradient id={gMetal} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metalA} />
          <stop offset="0.3" stopColor={metalB} />
          <stop offset="0.55" stopColor="#e6cd9d" />
          <stop offset="0.8" stopColor={metalB} />
          <stop offset="1" stopColor={metalA} />
        </linearGradient>
        <linearGradient id={gSheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id={gLabel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#faf7f0" />
          <stop offset="1" stopColor="#eee7d6" />
        </linearGradient>
        <filter id={blurShadow} x="-40%" y="-200%" width="180%" height="500%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {backdrop && <circle cx="160" cy="196" r="148" fill={accent} opacity="0.09" />}

      <ellipse
        cx="160"
        cy="366"
        rx="88"
        ry="10"
        fill="#0b1811"
        opacity="0.14"
        filter={`url(#${blurShadow})`}
      />

      {form === 'flask' && (
        <g>
          <rect x="126" y="62" width="68" height="36" rx="7" fill={`url(#${gMetal})`} />
          {[136, 146, 156, 166, 176, 186].map((x) => (
            <line
              key={x}
              x1={x}
              y1="66"
              x2={x}
              y2="94"
              stroke="#4a371f"
              strokeOpacity="0.28"
              strokeWidth="1.6"
            />
          ))}
          <rect x="133" y="98" width="54" height="14" fill={dark} />
          <path
            d="M112 138 C112 118 134 110 160 110 C186 110 208 118 208 138 L208 330 C208 344 197 350 184 350 L136 350 C123 350 112 344 112 330 Z"
            fill={`url(#${gGlass})`}
          />
          <clipPath id={clipBody}>
            <path d="M116 140 C116 122 136 114 160 114 C184 114 204 122 204 140 L204 328 C204 340 195 346 184 346 L136 346 C125 346 116 340 116 328 Z" />
          </clipPath>
          <g clipPath={`url(#${clipBody})`}>
            <rect x="112" y="150" width="96" height="200" fill={`url(#${gLiquid})`} opacity="0.9" />
            <ellipse cx="160" cy="150" rx="46" ry="5" fill={light} opacity="0.55" />
            <path d="M112 108 h96 v250 h-96 z" fill={`url(#${gSheen})`} />
            <rect x="124" y="118" width="9" height="216" rx="4.5" fill="#ffffff" opacity="0.22" />
            <rect x="196" y="130" width="4" height="190" rx="2" fill="#ffffff" opacity="0.10" />
          </g>
          <LabelGroup
            uid={uid}
            x={121}
            y={196}
            w={78}
            h={106}
            accent={accent}
            name={name}
            meta="60 CAPSULES · NET 48 g"
          />
        </g>
      )}

      {form === 'dropper' && (
        <g>
          <ellipse cx="160" cy="56" rx="17" ry="21" fill="#20241f" />
          <ellipse cx="155" cy="49" rx="5" ry="8" fill="#ffffff" opacity="0.14" />
          <rect x="144" y="74" width="32" height="24" rx="4" fill={`url(#${gMetal})`} />
          <rect x="158" y="97" width="4" height="30" rx="2" fill={light} opacity="0.85" />
          <path
            d="M120 152 C120 128 142 122 160 122 C178 122 200 128 200 152 L200 338 C200 351 189 357 176 357 L144 357 C131 357 120 351 120 338 Z"
            fill={`url(#${gGlass})`}
          />
          <clipPath id={clipBody}>
            <path d="M124 154 C124 132 143 126 160 126 C177 126 196 132 196 154 L196 336 C196 347 187 353 176 353 L144 353 C133 353 124 347 124 336 Z" />
          </clipPath>
          <g clipPath={`url(#${clipBody})`}>
            <rect
              x="120"
              y="142"
              width="80"
              height="215"
              fill={`url(#${gLiquid})`}
              opacity="0.92"
            />
            <ellipse cx="160" cy="142" rx="38" ry="4.5" fill={light} opacity="0.55" />
            <path d="M116 118 h88 v240 h-88 z" fill={`url(#${gSheen})`} />
            <rect x="131" y="130" width="8" height="212" rx="4" fill="#ffffff" opacity="0.22" />
          </g>
          <LabelGroup
            uid={uid}
            x={128}
            y={210}
            w={64}
            h={100}
            accent={accent}
            name={name}
            meta="30 ml · ALCOHOL-FREE"
          />
        </g>
      )}

      {form === 'jar' && (
        <g>
          <rect x="110" y="148" width="100" height="38" rx="9" fill={`url(#${gMetal})`} />
          <rect x="110" y="158" width="100" height="3" fill="#4a371f" opacity="0.22" />
          <path
            d="M104 198 L216 198 C220 238 218 314 208 334 C201 348 178 354 160 354 C142 354 119 348 112 334 C102 314 100 238 104 198 Z"
            fill={`url(#${gGlass})`}
          />
          <clipPath id={clipBody}>
            <path d="M109 203 L211 203 C214 240 213 310 205 329 C199 342 179 349 160 349 C141 349 121 342 115 329 C107 310 106 240 109 203 Z" />
          </clipPath>
          <g clipPath={`url(#${clipBody})`}>
            <rect
              x="100"
              y="203"
              width="120"
              height="150"
              fill={`url(#${gLiquid})`}
              opacity="0.85"
            />
            <path d="M100 198 h120 v160 h-120 z" fill={`url(#${gSheen})`} />
            <rect x="117" y="206" width="10" height="132" rx="5" fill="#ffffff" opacity="0.20" />
          </g>
          <LabelGroup
            uid={uid}
            x={113}
            y={236}
            w={94}
            h={72}
            accent={accent}
            name={name}
            meta="NET 100 g"
            compact
          />
        </g>
      )}

      {form === 'pump' && (
        <g>
          <path d="M150 52 h44 a6 6 0 0 1 6 6 v6 h-50 z" fill="#262b26" />
          <rect x="188" y="58" width="13" height="22" rx="4" fill="#262b26" />
          <rect x="149" y="63" width="24" height="28" rx="3" fill={`url(#${gMetal})`} />
          <path
            d="M118 128 C118 112 140 106 160 106 C180 106 202 112 202 128 L202 344 C202 354 193 360 182 360 L138 360 C127 360 118 354 118 344 Z"
            fill={`url(#${gGlass})`}
          />
          <clipPath id={clipBody}>
            <path d="M122 130 C122 116 141 110 160 110 C179 110 198 116 198 130 L198 342 C198 350 191 356 182 356 L138 356 C129 356 122 350 122 342 Z" />
          </clipPath>
          <g clipPath={`url(#${clipBody})`}>
            <rect x="118" y="134" width="84" height="230" fill={`url(#${gLiquid})`} opacity="0.9" />
            <path d="M118 106 h84 v254 h-84 z" fill={`url(#${gSheen})`} />
            <rect x="130" y="116" width="8" height="228" rx="4" fill="#ffffff" opacity="0.22" />
          </g>
          <LabelGroup
            uid={uid}
            x={127}
            y={192}
            w={66}
            h={108}
            accent={accent}
            name={name}
            meta="250 ml"
          />
        </g>
      )}

      {form === 'tin' && (
        <g>
          <rect x="94" y="204" width="132" height="24" rx="11" fill={`url(#${gMetal})`} />
          <ellipse cx="160" cy="207" rx="62" ry="7" fill="#e6cd9d" opacity="0.75" />
          <rect x="99" y="226" width="122" height="112" rx="15" fill={`url(#${gGlass})`} />
          <path
            d="M99 226 h122 v112 h-122 z"
            fill={`url(#${gSheen})`}
            opacity="0.5"
            clipPath={`url(#${clipBody})`}
          />
          <clipPath id={clipBody}>
            <rect x="99" y="226" width="122" height="112" rx="15" />
          </clipPath>
          <rect x="105" y="232" width="8" height="100" rx="4" fill="#ffffff" opacity="0.18" />
          <LabelGroup
            uid={uid}
            x={111}
            y={244}
            w={98}
            h={76}
            accent={accent}
            name={name}
            meta="LOOSE BLEND · 75 g"
            compact
          />
        </g>
      )}

      {form === 'tube' && (
        <g>
          <rect x="126" y="338" width="68" height="18" rx="5" fill={`url(#${gMetal})`} />
          <path
            d="M128 338 L192 338 C199 300 199 214 189 178 L172 170 L148 170 L131 178 C121 214 121 300 128 338 Z"
            fill={`url(#${gGlass})`}
          />
          <clipPath id={clipBody}>
            <path d="M132 336 L188 336 C194 300 194 216 185 181 L171 174 L149 174 L135 181 C126 216 126 300 132 336 Z" />
          </clipPath>
          <g clipPath={`url(#${clipBody})`}>
            <rect
              x="126"
              y="174"
              width="68"
              height="164"
              fill={`url(#${gLiquid})`}
              opacity="0.85"
            />
            <path d="M126 170 h68 v168 h-68 z" fill={`url(#${gSheen})`} />
            <rect x="137" y="180" width="7" height="150" rx="3.5" fill="#ffffff" opacity="0.2" />
          </g>
          <rect x="139" y="162" width="42" height="9" rx="2.5" fill={dark} />
          <LabelGroup
            uid={uid}
            x={136}
            y={226}
            w={48}
            h={74}
            accent={accent}
            name={name}
            meta="75 ml"
            tiny
          />
        </g>
      )}
    </svg>
  )
}

interface LabelGroupProps {
  uid: string
  x: number
  y: number
  w: number
  h: number
  accent: string
  name: string
  meta: string
  compact?: boolean
  tiny?: boolean
}

function LabelGroup({
  uid,
  x,
  y,
  w,
  h,
  accent,
  name,
  meta,
  compact = false,
  tiny = false,
}: LabelGroupProps) {
  const cx = x + w / 2
  const words = name.replace(/^ARANYA\s/, '').split(' ')
  const line1 = compact || tiny ? words.slice(0, Math.ceil(words.length / 2)) : words.slice(0, 2)
  const line2 = compact || tiny ? words.slice(Math.ceil(words.length / 2)) : words.slice(2)
  const brandSize = tiny ? 6 : 7.5
  const longestLine = Math.max(line1.join(' ').length, line2.join(' ').length)
  const shrink = longestLine > 14 ? 0.82 : longestLine > 11 ? 0.92 : 1
  const nameSize = (tiny ? 8.5 : compact ? 10 : 11.5) * shrink

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill={`url(#label-${uid})`}
        stroke={accent}
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <rect
        x={x + 3.5}
        y={y + 3.5}
        width={w - 7}
        height={h - 7}
        rx="2.5"
        fill="none"
        stroke={accent}
        strokeOpacity="0.35"
        strokeWidth="0.7"
      />
      <text
        x={cx}
        y={y + (tiny ? 13 : 17)}
        textAnchor="middle"
        fontFamily="'Manrope Variable', sans-serif"
        fontSize={brandSize}
        fontWeight="700"
        letterSpacing="2.4"
        fill="#8f6b3f"
      >
        ARANYA
      </text>
      <line
        x1={cx - (tiny ? 10 : 16)}
        y1={y + (tiny ? 18 : 23)}
        x2={cx + (tiny ? 10 : 16)}
        y2={y + (tiny ? 18 : 23)}
        stroke="#8f6b3f"
        strokeOpacity="0.55"
        strokeWidth="0.8"
      />
      <text
        x={cx}
        y={y + (tiny ? 32 : compact ? 41 : 47)}
        textAnchor="middle"
        fontFamily="'Fraunces Variable', serif"
        fontSize={nameSize}
        fill="#1b3527"
      >
        {line1.join(' ')}
      </text>
      {line2.length > 0 && (
        <text
          x={cx}
          y={y + (tiny ? 44 : compact ? 55 : 62)}
          textAnchor="middle"
          fontFamily="'Fraunces Variable', serif"
          fontStyle="italic"
          fontSize={nameSize * 0.92}
          fill="#1b3527"
        >
          {line2.join(' ')}
        </text>
      )}
      {!tiny && (
        <>
          <line
            x1={cx - 14}
            y1={y + h - (compact ? 16 : 22)}
            x2={cx + 14}
            y2={y + h - (compact ? 16 : 22)}
            stroke="#1b3527"
            strokeOpacity="0.3"
            strokeWidth="0.8"
          />
          <text
            x={cx}
            y={y + h - (compact ? 6 : 9)}
            textAnchor="middle"
            fontFamily="'Manrope Variable', sans-serif"
            fontSize={compact ? 5.4 : 5.8}
            letterSpacing="1"
            fill="#1b3527"
            fillOpacity="0.65"
          >
            {meta}
          </text>
        </>
      )}
      {tiny && (
        <text
          x={cx}
          y={y + h - 6}
          textAnchor="middle"
          fontFamily="'Manrope Variable', sans-serif"
          fontSize={5.4}
          letterSpacing="1"
          fill="#1b3527"
          fillOpacity="0.65"
        >
          {meta}
        </text>
      )}
    </g>
  )
}
