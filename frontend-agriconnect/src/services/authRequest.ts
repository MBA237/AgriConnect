import type { AuthMode } from './authFlow'

type DeliveryMethod = 'email' | 'phone'
type BackendAuthMode = 'login' | 'register'

type AuthRequestInput = {
  deliveryMethod: DeliveryMethod
  email?: string
  phone?: string
  role?: string
  mode?: AuthMode
}

type AuthVerifyInput = AuthRequestInput & {
  code: string
  firstName?: string
  lastName?: string
  password?: string
}

type AuthRequestPayload = {
  identifier: string
  type: 'email' | 'contact'
  role: string
  mode: BackendAuthMode
}

type AuthVerifyPayload = AuthRequestPayload & {
  otp: string
  code: string
  fullName?: string
  password?: string
}

function normalizePhoneIdentifier(value: string | undefined) {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

function mapRoleToBackend(role: string | undefined) {
  switch (role) {
    case 'agriculteur':
    case 'FARMER':
      return 'FARMER'
    case 'acheteur-pro':
    case 'BUYER_PRO':
      return 'BUYER_PRO'
    case 'acheteur-particulier':
    case 'BUYER_PARTICULIER':
      return 'BUYER_PARTICULIER'
    case 'ADMIN':
      return 'ADMIN'
    default:
      return role || 'BUYER_PARTICULIER'
  }
}

export function buildAuthRequestPayload({ deliveryMethod, email, phone, role, mode }: AuthRequestInput): AuthRequestPayload {
  const identifier = deliveryMethod === 'email' ? (email || '').trim() : normalizePhoneIdentifier(phone)
  const type = deliveryMethod === 'email' ? 'email' : 'contact'

  return {
    identifier,
    type,
    role: mapRoleToBackend(role),
    mode: mode === 'login' ? 'login' : 'register',
  }
}

export function buildAuthVerifyPayload({ deliveryMethod, email, phone, code, mode, role, firstName, lastName, password }: AuthVerifyInput): AuthVerifyPayload {
  const identifier = deliveryMethod === 'email' ? (email || '').trim() : normalizePhoneIdentifier(phone)
  const type = deliveryMethod === 'email' ? 'email' : 'contact'
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  const payload: AuthVerifyPayload = {
    identifier,
    type,
    otp: code,
    code,
    mode: mode === 'login' ? 'login' : 'register',
    role: mapRoleToBackend(role),
  }

  if (fullName) payload.fullName = fullName
  if (password) payload.password = password

  return payload
}