export type ClassValue = string | number | null | undefined | false

/** Minimal class joiner — no clsx/tailwind-merge needed for this codebase's controlled class sets. */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ')
}
