export type AuthMode = 'choice' | 'register' | 'login'

export function resolveAuthMode(value?: string | null): AuthMode {
  if (value === 'login') return 'login'
  if (value === 'register') return 'register'
  return 'choice'
}
