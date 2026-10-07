function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function parse(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`
}

/** amount > 0 lightens toward white, < 0 darkens toward black */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex)
  if (amount >= 0) {
    return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount])
  }
  const k = 1 + amount
  return toHex([r * k, g * k, b * k])
}
