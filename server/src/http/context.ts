import type { Role } from '@aranya/shared'

interface AuthContext {
  sub: string
  email: string
  role: Role
}

export interface AppEnv {
  Variables: {
    requestId: string
    auth: AuthContext | null
  }
}
