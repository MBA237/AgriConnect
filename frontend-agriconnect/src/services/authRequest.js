function normalizePhoneIdentifier(value) {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

function mapRoleToBackend(role) {
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

export function buildAuthRequestPayload({ deliveryMethod, email, phone, role, mode }) {
  const identifier = deliveryMethod === 'email' ? (email || '').trim() : normalizePhoneIdentifier(phone)
  const type = deliveryMethod === 'email' ? 'email' : 'contact'

  return {
    identifier,
    type,
    role: mapRoleToBackend(role),
    mode: mode === 'login' ? 'login' : 'register',
  }
}

export function buildAuthVerifyPayload({ deliveryMethod, email, phone, code, mode, role, firstName, lastName, password }) {
  const identifier = deliveryMethod === 'email' ? (email || '').trim() : normalizePhoneIdentifier(phone)
  const type = deliveryMethod === 'email' ? 'email' : 'contact'
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  const payload = {
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
