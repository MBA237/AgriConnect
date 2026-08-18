import { describe, expect, it } from 'vitest'
import { resolveAuthMode } from './authFlow'

describe('resolveAuthMode', () => {
  it('returns login for the login query parameter', () => {
    expect(resolveAuthMode('login')).toBe('login')
  })

  it('returns register for the register query parameter', () => {
    expect(resolveAuthMode('register')).toBe('register')
  })

  it('defaults to choice for unknown values', () => {
    expect(resolveAuthMode('unexpected')).toBe('choice')
  })
})
