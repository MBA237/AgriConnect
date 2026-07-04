import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Auth helpers
const USE_MOCK = import.meta.env.VITE_API_MOCK === 'true'

export async function requestOtp(payload: {
  deliveryMethod: 'email' | 'phone'
  email?: string
  phone?: string
  role?: string
  firstName?: string
  lastName?: string
  gender?: string
}): Promise<{ data: any }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { code: '123456' } }), 450))
  }
  return api.post('/auth/request-otp', payload)
}

export async function verifyOtp(payload: { deliveryMethod: 'email' | 'phone'; email?: string; phone?: string; code: string }): Promise<{ data: any }> {
  if (USE_MOCK) {
    const user = {
      id: 'user-mock-001',
      name: payload.email ? payload.email.split('@')[0] : payload.phone || 'Utilisateur',
      email: payload.email || '',
      role: 'acheteur-particulier',
      phone: payload.phone || undefined,
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { token: 'mock-token-abc123', user } }), 450))
  }
  return api.post('/auth/verify-otp', payload)
}

export async function loginRequest(payload: { email?: string; password?: string }) {
  return api.post('/auth/login', payload)
}

export async function refreshToken(payload: { refreshToken: string }) {
  return api.post('/auth/refresh', payload)
}

export async function me() {
  return api.get('/auth/me')
}

export async function updateProfile(payload: any): Promise<{ data: any }> {
  if (USE_MOCK) {
    // merge incoming payload into a mock user object (keep role if provided)
    const user = {
      id: 'user-mock-001',
      name: payload.name || 'Utilisateur',
      email: payload.email || '',
      role: payload.role || 'acheteur-particulier',
      phone: payload.phone,
      gender: payload.gender,
      // include any extra fields (farmName, company, siret, etc.) for dev
      ...(payload.extra || {}),
      ...payload,
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { user } }), 350))
  }
  return api.put('/auth/me', payload)
}

export default api
