export type FieldError = string | undefined

export function required(value: string, label: string): FieldError {
  return value.trim().length === 0 ? `${label} is required` : undefined
}

export function minLength(value: string, min: number, label: string): FieldError {
  return value.trim().length < min ? `${label} must be at least ${min} characters` : undefined
}

export function validEmail(value: string): FieldError {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    ? undefined
    : 'Enter a valid email address'
}

export function validPhoneIN(value: string): FieldError {
  const digits = value.replace(/[\s\-()+]/g, '').replace(/^91(?=\d{10}$)/, '')
  return /^\d{10}$/.test(digits) ? undefined : 'Enter a valid 10-digit phone number'
}

export function validPostalIN(value: string): FieldError {
  return /^\d{6}$/.test(value.trim()) ? undefined : 'Enter a valid 6-digit PIN code'
}

export function validUpiId(value: string): FieldError {
  return /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(value.trim())
    ? undefined
    : 'Enter a valid UPI ID (e.g. name@bank)'
}
