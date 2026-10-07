import { Minus, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  tone?: 'dark' | 'light'
  className?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  label = 'Quantity',
  tone = 'dark',
  className,
}: QuantityStepperProps) {
  const btnBase =
    'grid size-9 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35'
  const btnTone =
    tone === 'light'
      ? 'border-ivory-50/25 text-ivory-100 hover:bg-ivory-50/10'
      : 'border-forest-900/20 text-forest-900 hover:bg-forest-900/[0.05]'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full p-1',
        tone === 'light' ? 'bg-ivory-50/[0.06]' : 'bg-forest-900/[0.04]',
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={cn(btnBase, btnTone)}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span
        className={cn(
          'min-w-7 text-center text-sm font-semibold tabular-nums',
          tone === 'light' ? 'text-ivory-100' : 'text-forest-900',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(btnBase, btnTone)}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
