import { m } from 'framer-motion'
import { formatPrice } from '@/utils/format'

export function MonthBars({
  data,
  height = 200,
}: {
  data: Array<{ label: string; value: number }>
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div
      className="flex items-end gap-3 sm:gap-5"
      style={{ height }}
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d, i) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2.5">
          <span className="text-[10px] font-bold text-sage-300/70 tabular-nums">
            {formatPrice(d.value)}
          </span>
          <m.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(5, (d.value / max) * 100)}%` }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-moss-600 to-bronze-500"
            title={`${d.label}: ${formatPrice(d.value)}`}
          />
          <span className="text-xs font-semibold text-sage-300/70">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

const DONUT_COLORS = ['#c29a64', '#8aa48c', '#5d8266', '#a85a38', '#44684c']

export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Array<{ label: string; value: number }>
  centerLabel: string
  centerValue: string | number
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const R = 56
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 140 140" className="size-36 -rotate-90" role="img" aria-label="Donut chart">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#14291e" strokeWidth="16" />
        {segments.map((s, i) => {
          if (s.value === 0) return null
          const frac = s.value / total
          const dash = `${frac * C} ${C - frac * C}`
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={dash}
              strokeDashoffset={-offset * C}
              strokeLinecap="butt"
            />
          )
          offset += frac
          return el
        })}
        <text
          x="70"
          y="66"
          textAnchor="middle"
          fill="#faf7f0"
          fontSize="22"
          fontFamily="'Fraunces Variable', serif"
          transform="rotate(90 70 70)"
        >
          {centerValue}
        </text>
        <text
          x="70"
          y="84"
          textAnchor="middle"
          fill="#a8bcab"
          fontSize="9"
          fontFamily="'Manrope Variable', sans-serif"
          letterSpacing="1.5"
          transform="rotate(90 70 70)"
        >
          {centerLabel.toUpperCase()}
        </text>
      </svg>
      <ul className="space-y-2.5">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
            />
            <span className="text-sage-200/80">{s.label}</span>
            <span className="ml-auto font-bold text-ivory-50 tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HBars({
  data,
}: {
  data: Array<{ label: string; value: number; display: string }>
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul className="space-y-4">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="truncate font-semibold text-sage-200/85">{d.label}</span>
            <span className="shrink-0 font-bold text-ivory-50 tabular-nums">{d.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-forest-800">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-moss-500 to-bronze-500"
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
