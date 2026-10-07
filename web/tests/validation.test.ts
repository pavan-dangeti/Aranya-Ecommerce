import { describe, expect, it } from 'vitest'
import {
  minLength,
  required,
  validEmail,
  validPhoneIN,
  validPostalIN,
  validUpiId,
} from '../src/utils/validate'
import { fieldErrorList, fieldErrors } from '../src/utils/errors'
import { ApiError } from '../src/lib/api'

describe('form validators', () => {
  it.each([
    ['required', required('  ', 'Name'), 'Name is required'],
    ['required ok', required('Asha', 'Name'), undefined],
    ['minLength', minLength('abc', 8, 'Password'), 'Password must be at least 8 characters'],
    ['minLength ok', minLength('abcdefgh', 8, 'Password'), undefined],
  ])('%s', (_, actual, expected) => expect(actual).toBe(expected))

  it.each(['asha@example.com', ' a.b+c@shop.co.in '])('accepts email %s', (v) =>
    expect(validEmail(v)).toBeUndefined(),
  )
  it.each(['asha', 'asha@', 'a@b', 'a b@c.com'])('rejects email %s', (v) =>
    expect(validEmail(v)).toBeDefined(),
  )

  it.each(['9876543210', '+91 98765 43210', '98765-43210'])('accepts phone %s', (v) =>
    expect(validPhoneIN(v)).toBeUndefined(),
  )
  it.each(['12345', '98765432101', 'phone'])('rejects phone %s', (v) =>
    expect(validPhoneIN(v)).toBeDefined(),
  )

  it('validates 6-digit PIN codes', () => {
    expect(validPostalIN('560001')).toBeUndefined()
    expect(validPostalIN('56001')).toBeDefined()
    expect(validPostalIN('5600011')).toBeDefined()
  })

  it('validates UPI ids', () => {
    expect(validUpiId('asha@okaxis')).toBeUndefined()
    expect(validUpiId('asha')).toBeDefined()
    expect(validUpiId('@okaxis')).toBeDefined()
  })
})

describe('server error mapping', () => {
  it('groups validation details by field', () => {
    const err = new ApiError(422, 'validation_error', 'Invalid input', 'r1', [
      { path: 'email', message: 'Invalid email' },
      { path: 'password', message: 'Too short' },
      { path: 'password', message: 'Needs a digit' },
    ])
    expect(fieldErrors(err)).toEqual({
      message: 'Invalid input',
      fields: { email: ['Invalid email'], password: ['Too short', 'Needs a digit'] },
    })
  })

  it('falls back to a readable message for unknown errors', () => {
    expect(fieldErrors('weird')).toEqual({
      message: 'Something went wrong. Please try again.',
      fields: {},
    })
    expect(fieldErrors(new Error('Network down')).message).toBe('Network down')
  })

  it('flattens field errors into display lines', () => {
    expect(fieldErrorList({ email: ['Invalid email'], '': ['Generic'] })).toEqual([
      'email: Invalid email',
      'Generic',
    ])
  })
})
