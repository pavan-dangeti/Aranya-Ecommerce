import { pino } from 'pino'
import { env } from './env.js'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'aranya-api' },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'password',
      '*.password',
      'newPassword',
      'currentPassword',
      'token',
      'refreshToken',
    ],
    censor: '[redacted]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
})
