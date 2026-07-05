import axios from 'axios'

export type Product = {
  id: string
  title: string
  category: string
  price: number
  unit: string
  location: string
  stock: number
  quality: string
  deliveryTime: string
  description: string
  farmerName: string
  ownerId?: string
  publishedAt?: string
  images?: string[]
}

export type PriceData = {
  productId: string
  productTitle: string
  category: string
  currentPrice: number
  previousPrice: number
  priceChange: number
  priceChangePercent: number
  unit: string
  timestamp: string
  trend: 'up' | 'down' | 'stable'
}

export type PriceHistoryData = {
  timestamp: string
  price: number
  volume: number
}

export type LimitOrder = {
  id: string
  productId: string
  productTitle: string
  userId: string
  limitPrice: number
  quantity: number
  unit: string
  status: 'pending' | 'matched' | 'cancelled'
  createdAt: string
  matchedAt?: string
}

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
    const user = {
      id: 'user-mock-001',
      name: payload.name || 'Utilisateur',
      email: payload.email || '',
      role: payload.role || 'acheteur-particulier',
      phone: payload.phone,
      gender: payload.gender,
      ...(payload.extra || {}),
      ...payload,
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { user } }), 350))
  }
  return api.put('/auth/me', payload)
}

export async function getProducts(params?: Record<string, any>): Promise<{ data: { products: Product[] } }> {
  if (USE_MOCK) {
    const products: Product[] = [
      {
        id: 'p1',
        title: 'Maïs blanc premium',
        category: 'Céréales',
        price: 4500,
        unit: 'kg',
        location: 'Dschang',
        stock: 120,
        quality: 'Premium',
        deliveryTime: '24h',
        description: 'Maïs de saison, récolte fraîche et bien séchée.',
        farmerName: 'M. Tchouga',
        ownerId: 'user-mock-001',
        publishedAt: '2026-07-03T08:30:00.000Z',
        images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'],
      },
      {
        id: 'p2',
        title: 'Haricots rouges bio',
        category: 'Légumes',
        price: 6200,
        unit: 'kg',
        location: 'Bafoussam',
        stock: 80,
        quality: 'Bio',
        deliveryTime: '48h',
        description: 'Lot de haricots certifié bio, disponible en grande quantité.',
        farmerName: 'Mme. Kuete',
        ownerId: 'user-mock-002',
        publishedAt: '2026-07-02T12:00:00.000Z',
        images: ['https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80'],
      },
      {
        id: 'p3',
        title: 'Ananas doux',
        category: 'Fruits',
        price: 3000,
        unit: 'kg',
        location: 'Bamenda',
        stock: 50,
        quality: 'Standard',
        deliveryTime: '12h',
        description: 'Fruit juteux à la saveur intense, idéal pour la transformation.',
        farmerName: 'M. Fomekong',
        ownerId: 'user-mock-003',
        publishedAt: '2026-07-01T16:20:00.000Z',
        images: ['https://images.unsplash.com/photo-1490885578174-acda7f0f7f4a?auto=format&fit=crop&w=900&q=80'],
      },
    ]

    const filtered = products.filter(product => {
      const q = (params?.search ?? '').toString().toLowerCase()
      const cat = (params?.category ?? 'all').toString()
      const matchesSearch = !q || [product.title, product.description, product.category, product.location].join(' ').toLowerCase().includes(q)
      const matchesCategory = !cat || cat === 'all' || product.category === cat
      return matchesSearch && matchesCategory
    })

    const sorted = [...filtered].sort((a, b) => {
      if (params?.sort === 'price-asc') return a.price - b.price
      if (params?.sort === 'price-desc') return b.price - a.price
      if (params?.sort === 'newest') {
        const aTime = new Date(a.publishedAt ?? '').getTime() || Number.parseInt((a.id || '').replace(/\D/g, ''), 10) || 0
        const bTime = new Date(b.publishedAt ?? '').getTime() || Number.parseInt((b.id || '').replace(/\D/g, ''), 10) || 0
        return bTime - aTime
      }
      return b.id.localeCompare(a.id)
    })

    return new Promise(resolve => setTimeout(() => resolve({ data: { products: sorted } }), 250))
  }

  return api.get('/products', { params })
}

export async function getProduct(id: string): Promise<{ data: { product: Product } }> {
  if (USE_MOCK) {
    const product = {
      id,
      title: 'Maïs blanc premium',
      category: 'Céréales',
      price: 4500,
      unit: 'kg',
      location: 'Dschang',
      stock: 120,
      quality: 'Premium',
      deliveryTime: '24h',
      description: 'Maïs de saison, récolte fraîche et bien séchée.',
      farmerName: 'M. Tchouga',
      ownerId: 'user-mock-001',
      publishedAt: '2026-07-03T08:30:00.000Z',
      images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80'],
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { product } }), 250))
  }
  return api.get(`/products/${id}`)
}

export async function createProduct(payload: any): Promise<{ data: { product: Product } }> {
  if (USE_MOCK) {
    const product = {
      id: `p-${Date.now()}`,
      ...payload,
      price: Number(payload.price),
      stock: Number(payload.stock),
      ownerId: payload.ownerId ?? 'user-mock-001',
      publishedAt: payload.publishedAt ?? new Date().toISOString(),
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { product } }), 300))
  }
  return api.post('/products', payload)
}

export async function updateProduct(id: string, payload: any): Promise<{ data: { product: Product } }> {
  if (USE_MOCK) {
    const product = {
      id,
      ...payload,
      price: Number(payload.price),
      stock: Number(payload.stock),
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { product } }), 300))
  }
  return api.put(`/products/${id}`, payload)
}

export async function deleteProduct(id: string): Promise<{ data: { success: boolean } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 200))
  }
  return api.delete(`/products/${id}`)
}

// Market API functions
export async function getMarketPrices(): Promise<{ data: { prices: PriceData[] } }> {
  if (USE_MOCK) {
    const prices: PriceData[] = [
      {
        productId: 'p1',
        productTitle: 'Maïs blanc premium',
        category: 'Céréales',
        currentPrice: 4650,
        previousPrice: 4500,
        priceChange: 150,
        priceChangePercent: 3.33,
        unit: 'kg',
        timestamp: new Date().toISOString(),
        trend: 'up',
      },
      {
        productId: 'p2',
        productTitle: 'Haricots rouges bio',
        category: 'Légumes',
        currentPrice: 6050,
        previousPrice: 6200,
        priceChange: -150,
        priceChangePercent: -2.42,
        unit: 'kg',
        timestamp: new Date().toISOString(),
        trend: 'down',
      },
      {
        productId: 'p3',
        productTitle: 'Ananas doux',
        category: 'Fruits',
        currentPrice: 3000,
        previousPrice: 3000,
        priceChange: 0,
        priceChangePercent: 0,
        unit: 'kg',
        timestamp: new Date().toISOString(),
        trend: 'stable',
      },
    ]
    return new Promise(resolve => setTimeout(() => resolve({ data: { prices } }), 300))
  }
  return api.get('/market/prices')
}

export async function getMarketStats(): Promise<{ data: { offers: number; rating: number; avgDelivery: string; monthlyRevenue?: number } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { offers: 120, rating: 4.9, avgDelivery: '24h', monthlyRevenue: 124000 } }), 220))
  }
  return api.get('/market/stats')
}

export async function getUserStats(userId?: string): Promise<{ data: { rating: number; totalSales: number; contracts: number; memberSinceYears: number } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { rating: 4.8, totalSales: 47, contracts: 12, memberSinceYears: 2 } }), 200))
  }
  return api.get(`/users/${userId ?? 'me'}/stats`)
}

export async function getPriceHistory(productId: string): Promise<{ data: { history: PriceHistoryData[] } }> {
  if (USE_MOCK) {
    const history: PriceHistoryData[] = []
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000)
      const basePrice = productId === 'p1' ? 4500 : productId === 'p2' ? 6200 : 3000
      const price = basePrice + Math.random() * 200 - 100
      history.push({
        timestamp: time.toISOString(),
        price: Math.round(price),
        volume: Math.floor(Math.random() * 500) + 100,
      })
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { history } }), 250))
  }
  return api.get(`/market/history/${productId}`)
}

export async function createLimitOrder(payload: {
  productId: string
  limitPrice: number
  quantity: number
}): Promise<{ data: { order: LimitOrder } }> {
  if (USE_MOCK) {
    const order: LimitOrder = {
      id: `order-${Date.now()}`,
      productId: payload.productId,
      productTitle: 'Maïs blanc premium',
      userId: 'user-mock-001',
      limitPrice: payload.limitPrice,
      quantity: payload.quantity,
      unit: 'kg',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { order } }), 300))
  }
  return api.post('/market/orders-limit', payload)
}

export async function getLimitOrders(): Promise<{ data: { orders: LimitOrder[] } }> {
  if (USE_MOCK) {
    const orders: LimitOrder[] = [
      {
        id: 'order-1',
        productId: 'p1',
        productTitle: 'Maïs blanc premium',
        userId: 'user-mock-001',
        limitPrice: 4400,
        quantity: 50,
        unit: 'kg',
        status: 'pending',
        createdAt: '2026-07-05T10:00:00.000Z',
      },
      {
        id: 'order-2',
        productId: 'p2',
        productTitle: 'Haricots rouges bio',
        userId: 'user-mock-001',
        limitPrice: 5900,
        quantity: 30,
        unit: 'kg',
        status: 'matched',
        createdAt: '2026-07-04T14:30:00.000Z',
        matchedAt: '2026-07-05T09:15:00.000Z',
      },
    ]
    return new Promise(resolve => setTimeout(() => resolve({ data: { orders } }), 250))
  }
  return api.get('/market/orders-limit')
}

export async function createOrder(payload: { items: Array<{ productId: string; quantity: number; unit: string; price: number }>; total: number }): Promise<{ data: { order: { id: string; status: string; total: number } } }> {
  if (USE_MOCK) {
    const order = {
      id: `order-${Date.now()}`,
      status: 'pending',
      total: payload.total,
    }
    return new Promise(resolve => setTimeout(() => resolve({ data: { order } }), 400))
  }
  return api.post('/api/orders', payload)
}

export async function getMyOrders(): Promise<{ data: { orders: any[] } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { orders: [] } }), 300))
  }
  return api.get('/api/orders/my')
}

export async function getOrderDetail(id: string): Promise<{ data: { order: any } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { order: { id, status: 'pending', total: 0, items: [] } } }), 300))
  }
  return api.get(`/api/orders/${id}`)
}

export async function initiatePayment(payload: { orderId: string; method: string }): Promise<{ data: { reference: string } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { reference: `MOCK-${Date.now()}` } }), 400))
  }
  return api.post('/api/payments/initiate', payload)
}

export async function verifyMtnWebhook(payload: any): Promise<{ data: any }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { received: true } }), 300))
  }
  return api.post('/api/payments/webhook/mtn', payload)
}

// Orange Money payment integration
export async function initiateOrangePayment(payload: { orderId: string; phone: string; amount: number }): Promise<{ data: { reference: string } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { reference: `ORANGE-${Date.now()}` } }), 400))
  }
  return api.post('/api/payments/orange/initiate', payload)
}

export async function verifyOrangeWebhook(payload: any): Promise<{ data: any }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { received: true } }), 300))
  }
  return api.post('/api/payments/webhook/orange', payload)
}

export async function updateOrderStatus(id: string, payload: { status: string }): Promise<{ data: { success: boolean } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 300))
  }
  return api.put(`/api/orders/${id}/status`, payload)
}

export async function getPaymentReceipt(id: string): Promise<{ data: { receiptUrl: string } }> {
  if (USE_MOCK) {
    return new Promise(resolve => setTimeout(() => resolve({ data: { receiptUrl: `https://example.com/receipts/${id}.pdf` } }), 250))
  }
  return api.get(`/api/payments/${id}/receipt`)
}

export default api
