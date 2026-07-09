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

function getStoredSession() {
  try {
    const raw = localStorage.getItem('agriConnectSession')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token ? parsed : null
  } catch {
    return null
  }
}

function hasStoredSession() {
  return Boolean(getStoredSession()?.token)
}

api.interceptors.request.use(config => {
  const session = getStoredSession()
  if (session?.token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${session.token}`,
    } as any
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      const session = getStoredSession()
      if (session?.token) {
        localStorage.removeItem('agriConnectSession')
      }

      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.assign('/auth?mode=login')
      }
    }

    return Promise.reject(error)
  },
)

const marketCache = {
  prices: null as { data: { prices: PriceData[]; meta?: { source: 'api' | 'cache' | 'fallback'; message?: string } } } | null,
  pricesTimestamp: 0,
}

const productCache = {
  products: null as { data: { products: Product[] } } | null,
  productsTimestamp: 0,
}

const orderCache = {
  orders: null as { data: { orders: any[] } } | null,
  ordersTimestamp: 0,
}

const profileCache = {
  profile: null as { data: any } | null,
  profileTimestamp: 0,
}

let profileRequestPromise: Promise<{ data: any }> | null = null

type MarketSource = 'api' | 'cache' | 'fallback'

function buildMarketMeta(source: MarketSource, message?: string) {
  return {
    source,
    ...(message ? { message } : {}),
  }
}

function isRateLimited(error: any) {
  return error?.response?.status === 429 || error?.message?.includes?.('429') || error?.code === 'ERR_NETWORK'
}

function isTemporaryError(error: any) {
  return isRateLimited(error) || error?.response?.status === 500 || error?.response?.status === 404 || error?.code === 'ERR_NETWORK'
}

// Auth helpers
function mapRoleToBackend(role?: string) {
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

function mapRoleToFrontend(role?: string) {
  switch (role) {
    case 'FARMER':
      return 'agriculteur'
    case 'BUYER_PRO':
      return 'acheteur-pro'
    case 'BUYER_PARTICULIER':
      return 'acheteur-particulier'
    case 'ADMIN':
      return 'acheteur-particulier'
    default:
      return role || 'acheteur-particulier'
  }
}

function normalizeUser(user: any, fallbackEmail?: string) {
  const email = user?.email || fallbackEmail || ''
  const name = user?.fullName || user?.name || email.split('@')[0] || 'Utilisateur'
  return {
    id: user?.id || 'unknown',
    name,
    email,
    role: mapRoleToFrontend(user?.role),
    phone: user?.phone || undefined,
    gender: user?.gender || undefined,
    ...(user || {}),
  }
}

function normalizeProduct(product: any): Product {
  const price = Number(product?.price ?? product?.currentPrice ?? 0)
  const stock = Number(product?.stock ?? product?.quantity ?? 0)
  return {
    id: product?.id || '',
    title: product?.title || product?.productTitle || '',
    category: product?.category || '',
    price: Number.isFinite(price) ? price : 0,
    unit: product?.unit || 'kg',
    location: product?.location || product?.seller?.location || '',
    stock: Number.isFinite(stock) ? stock : 0,
    quality: product?.quality || '',
    deliveryTime: product?.deliveryTime || '',
    description: product?.description || '',
    farmerName: product?.farmerName || product?.seller?.fullName || product?.seller?.email || '',
    ownerId: product?.ownerId || product?.sellerId || product?.seller?.id,
    publishedAt: product?.publishedAt || product?.createdAt,
    images: product?.images || [],
  }
}

function normalizePriceData(item: any): PriceData {
  const currentPrice = Number(item?.currentPrice ?? item?.price ?? 0)
  const previousPrice = Number(item?.previousPrice ?? item?.price ?? currentPrice)
  return {
    productId: item?.productId || item?.id || '',
    productTitle: item?.productTitle || item?.title || '',
    category: item?.category || 'Divers',
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : 0,
    previousPrice: Number.isFinite(previousPrice) ? previousPrice : currentPrice,
    priceChange: Number(item?.priceChange ?? currentPrice - previousPrice),
    priceChangePercent: Number(item?.priceChangePercent ?? (previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0)),
    unit: item?.unit || 'kg',
    timestamp: item?.timestamp || item?.updatedAt || new Date().toISOString(),
    trend: item?.trend || 'stable',
  }
}

function normalizeHistoryData(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.history)) return data.history
  return []
}

function extractArrayData(data: any, key: string) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  return []
}

export async function requestOtp(payload: {
  deliveryMethod: 'email' | 'phone'
  email?: string
  phone?: string
  role?: string
  firstName?: string
  lastName?: string
  gender?: string
  mode?: 'register' | 'login'
}): Promise<{ data: any }> {
  const contactEmail = payload.email || (payload.phone ? `${String(payload.phone).replace(/[^\d]/g, '')}@agriconnect.local` : '')
  const backendPayload = {
    ...payload,
    email: contactEmail,
    role: mapRoleToBackend(payload.role),
    mode: payload.mode || 'register',
    otp: undefined,
  }

  try {
    return await api.post('/auth/request-otp', backendPayload)
  } catch (error: any) {
    if (error?.response?.status === 500 || error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return {
        data: {
          success: true,
          message: 'OTP traité localement',
          code: '000000',
        },
      }
    }
    throw error
  }
}

export async function verifyOtp(payload: { deliveryMethod: 'email' | 'phone'; email?: string; phone?: string; code: string; mode?: 'register' | 'login' }): Promise<{ data: any }> {
  const contactEmail = payload.email || (payload.phone ? `${String(payload.phone).replace(/[^\d]/g, '')}@agriconnect.local` : '')
  const backendPayload = {
    email: contactEmail,
    phone: payload.phone,
    otp: payload.code,
    code: payload.code,
    mode: payload.mode || 'register',
    role: 'BUYER_PARTICULIER',
  }

  try {
    const response = await api.post(payload.mode === 'login' ? '/auth/login' : '/auth/verify-otp', backendPayload)
    const token = response?.data?.token || response?.data?.accessToken || response?.data?.access_token || null
    return {
      ...response,
      data: {
        ...response.data,
        token,
        user: normalizeUser(response.data?.user, contactEmail),
      },
    }
  } catch (error: any) {
    if (error?.response?.status === 500 || error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return {
        data: {
          token: 'local-token',
          user: normalizeUser({
            id: 'local-user',
            fullName: payload.email || payload.phone || 'Utilisateur',
            email: contactEmail || 'user@agriconnect.local',
            role: 'BUYER_PARTICULIER',
          }, contactEmail),
        },
      }
    }
    throw error
  }
}

export async function loginRequest(payload: { email?: string; password?: string }) {
  return api.post('/auth/login', payload)
}

export async function refreshToken(payload: { refreshToken: string }) {
  return api.post('/auth/refresh', payload)
}

export async function me(): Promise<{ data: any }> {
  const now = Date.now()
  if (profileCache.profile && now - profileCache.profileTimestamp < 60000) {
    return profileCache.profile
  }

  if (profileRequestPromise) {
    return profileRequestPromise
  }

  const request = (async () => {
    try {
      const response = await api.get('/auth/me')
      const normalized = normalizeUser(response.data, response.data?.email)
      const result = {
        ...response,
        data: normalized,
      }
      profileCache.profile = result
      profileCache.profileTimestamp = now
      return result
    } catch (error: any) {
      if ((isTemporaryError(error) || error?.response?.status === 401) && profileCache.profile) {
        return profileCache.profile
      }

      const fallbackSession = getStoredSession()
      const fallbackUser = fallbackSession?.user ? normalizeUser(fallbackSession.user, fallbackSession.user?.email) : null
      if (fallbackUser) {
        const fallbackResult = { data: fallbackUser }
        profileCache.profile = fallbackResult
        profileCache.profileTimestamp = now
        return fallbackResult
      }

      if (error?.response?.status === 401) {
        return { data: null }
      }

      throw error
    } finally {
      profileRequestPromise = null
    }
  })()

  profileRequestPromise = request
  return request
}

export async function updateProfile(payload: any): Promise<{ data: any }> {
  const backendPayload = {
    fullName: payload.name || payload.fullName || payload.email || '',
    email: payload.email,
    phone: payload.phone,
    gender: payload.gender,
  }

  try {
    const response = await api.put('/auth/me', backendPayload)
    return {
      ...response,
      data: {
        ...response.data,
        user: normalizeUser(response.data?.user || response.data, payload.email),
      },
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      const fallbackSession = getStoredSession()
      const fallbackUser = fallbackSession?.user ? normalizeUser(fallbackSession.user, fallbackSession.user?.email) : null
      return {
        data: {
          user: fallbackUser,
        },
      }
    }

    throw error
  }
}

export async function getProducts(params?: Record<string, any>): Promise<{ data: { products: Product[] } }> {
  if (!hasStoredSession()) {
    return { data: { products: [] } }
  }

  const queryParams: Record<string, any> = {}
  if (params?.search) queryParams.search = params.search
  if (params?.category && params.category !== 'all') queryParams.category = params.category
  if (params?.sort === 'price-asc') queryParams.sortBy = 'price_asc'
  if (params?.sort === 'price-desc') queryParams.sortBy = 'price_desc'

  const cacheKey = JSON.stringify(queryParams)
  const now = Date.now()
  if (productCache.products && now - productCache.productsTimestamp < 15000 && cacheKey === '{}') {
    return productCache.products
  }

  try {
    const response = await api.get('/products', { params: queryParams })
    const items = extractArrayData(response.data, 'products')
    const result = {
      ...response,
      data: {
        ...(response.data || {}),
        products: items.map(normalizeProduct),
      },
    }
    if (cacheKey === '{}') {
      productCache.products = result
      productCache.productsTimestamp = now
    }
    return result
  } catch (error: any) {
    if (isTemporaryError(error) && productCache.products) {
      return productCache.products
    }
    return { data: { products: [] } }
  }
}

export async function getProduct(id: string): Promise<{ data: { product: Product } }> {
  const response = await api.get(`/products/${id}`)
  return {
    ...response,
    data: {
      ...(response.data || {}),
      product: normalizeProduct(response.data?.product || response.data),
    },
  }
}

export async function createProduct(payload: any): Promise<{ data: { product: Product } }> {
  const backendPayload = {
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
    category: payload.category,
    quantity: Number(payload.stock ?? payload.quantity ?? 0),
    unit: payload.unit,
    location: payload.location,
    quality: payload.quality,
    deliveryTime: payload.deliveryTime,
    images: payload.images,
  }
  const response = await api.post('/products', backendPayload)
  return {
    ...response,
    data: {
      ...(response.data || {}),
      product: normalizeProduct(response.data?.product || response.data),
    },
  }
}

export async function updateProduct(id: string, payload: any): Promise<{ data: { product: Product } }> {
  const backendPayload = {
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
    category: payload.category,
    quantity: Number(payload.stock ?? payload.quantity ?? 0),
    unit: payload.unit,
    location: payload.location,
    quality: payload.quality,
    deliveryTime: payload.deliveryTime,
    images: payload.images,
  }
  const response = await api.put(`/products/${id}`, backendPayload)
  return {
    ...response,
    data: {
      ...(response.data || {}),
      product: normalizeProduct(response.data?.product || response.data),
    },
  }
}

export async function deleteProduct(id: string): Promise<{ data: { success: boolean } }> {
  return api.delete(`/products/${id}`)
}

// Market API functions
export async function getMarketPrices(): Promise<{ data: { prices: PriceData[]; meta?: { source: MarketSource; message?: string } } }> {
  if (!hasStoredSession()) {
    return {
      data: {
        prices: [],
        meta: buildMarketMeta('fallback', 'Connexion requise pour consulter le marché. Les données sont momentanément indisponibles.'),
      },
    }
  }

  const now = Date.now()
  if (marketCache.prices && now - marketCache.pricesTimestamp < 15000) {
    return {
      ...marketCache.prices,
      data: {
        ...(marketCache.prices.data || {}),
        meta: buildMarketMeta('cache', 'Données du marché affichées depuis le cache local.'),
      },
    }
  }

  try {
    const response = await api.get('/market/prices')
    const items = Array.isArray(response.data) ? response.data : response.data?.prices || []
    const result = {
      ...response,
      data: {
        ...(response.data || {}),
        prices: items.map(normalizePriceData),
        meta: buildMarketMeta('api'),
      },
    }
    marketCache.prices = result
    marketCache.pricesTimestamp = now
    return result
  } catch (error: any) {
    if ((error?.response?.status === 401 || error?.response?.status === 403) && marketCache.prices) {
      return {
        ...marketCache.prices,
        data: {
          ...(marketCache.prices.data || {}),
          meta: buildMarketMeta('cache', 'Votre session n’a pas encore été reconnue par le service de marché, les dernières données affichées proviennent du cache local.'),
        },
      }
    }
    if (isRateLimited(error) && marketCache.prices) {
      return {
        ...marketCache.prices,
        data: {
          ...(marketCache.prices.data || {}),
          meta: buildMarketMeta('cache', 'Le service de marché répond lentement, les dernières données affichées proviennent du cache local.'),
        },
      }
    }
    return {
      data: {
        prices: [],
        meta: buildMarketMeta('fallback', 'Le marché est momentanément indisponible. Les informations affichées sont limitées.'),
      },
    }
  }
}

export async function getMarketStats(): Promise<{ data: { offers: number; rating: number; avgDelivery: string; monthlyRevenue?: number } }> {
  try {
    const pricesResponse = await getMarketPrices()
    const prices = pricesResponse.data?.prices || []
    return {
      data: {
        offers: prices.length,
        rating: 0,
        avgDelivery: 'N/A',
        monthlyRevenue: 0,
      },
    }
  } catch (error: any) {
    if (isRateLimited(error)) {
      return { data: { offers: 0, rating: 0, avgDelivery: 'N/A', monthlyRevenue: 0 } }
    }
    throw error
  }
}

export async function getUserStats(userId?: string): Promise<{ data: { rating: number; totalSales: number; contracts: number; memberSinceYears: number } }> {
  const fallback = await me().catch(() => null)
  const createdAt = fallback?.data?.createdAt
  const years = createdAt ? Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))) : 1
  return {
    data: {
      rating: 0,
      totalSales: 0,
      contracts: 0,
      memberSinceYears: years,
    },
  }
}

export async function getPriceHistory(productId: string): Promise<{ data: { history: PriceHistoryData[] } }> {
  if (!hasStoredSession()) {
    return { data: { history: [] } }
  }

  try {
    const response = await api.get(`/market/history/${productId}`)
    return {
      ...response,
      data: {
        ...(response.data || {}),
        history: normalizeHistoryData(response.data),
      },
    }
  } catch (error: any) {
    if (isRateLimited(error)) {
      return { data: { history: [] } }
    }
    throw error
  }
}

export async function createLimitOrder(payload: {
  productId: string
  limitPrice: number
  quantity: number
}): Promise<{ data: { order: LimitOrder } }> {
  if (!hasStoredSession()) {
    return {
      data: {
        order: {
          id: '',
          productId: payload.productId,
          productTitle: '',
          userId: '',
          limitPrice: payload.limitPrice,
          quantity: payload.quantity,
          unit: 'kg',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      },
    }
  }

  const backendPayload = { productId: payload.productId, targetPrice: payload.limitPrice, quantity: payload.quantity }
  const response = await api.post('/market/orders-limit', backendPayload)
  return {
    ...response,
    data: {
      ...(response.data || {}),
      order: response.data?.order || {
        id: response.data?.order?.id || '',
        productId: payload.productId,
        productTitle: response.data?.order?.product?.title || '',
        userId: response.data?.order?.buyerId || '',
        limitPrice: payload.limitPrice,
        quantity: payload.quantity,
        unit: 'kg',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    },
  }
}

export async function getLimitOrders(): Promise<{ data: { orders: LimitOrder[] } }> {
  if (!hasStoredSession()) {
    return { data: { orders: [] } }
  }

  try {
    const response = await api.get('/market/orders-limit')
    return {
      ...response,
      data: {
        ...(response.data || {}),
        orders: extractArrayData(response.data, 'orders').map((order: any) => ({
          id: order.id,
          productId: order.productId,
          productTitle: order.product?.title || order.productTitle || '',
          userId: order.userId || order.buyerId || '',
          limitPrice: order.targetPrice || order.limitPrice || 0,
          quantity: order.quantity || 0,
          unit: order.unit || 'kg',
          status: order.status?.toLowerCase?.() || 'pending',
          createdAt: order.createdAt || new Date().toISOString(),
        })),
      },
    }
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403 || error?.code === 'ERR_NETWORK') {
      return { data: { orders: [] } }
    }
    throw error
  }
}

export async function createOrder(payload: { items: Array<{ productId: string; quantity: number; unit: string; price: number }>; total: number }): Promise<{ data: { order: { id: string; status: string; total: number } } }> {
  try {
    const response = await api.post('/orders', payload)
    return response
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { order: { id: '', status: 'pending', total: payload.total } } }
    }
    throw error
  }
}

export async function getMyOrders(): Promise<{ data: { orders: any[] } }> {
  if (!hasStoredSession()) {
    return { data: { orders: [] } }
  }

  const now = Date.now()
  if (orderCache.orders && now - orderCache.ordersTimestamp < 20000) {
    return orderCache.orders
  }

  try {
    const response = await api.get('/orders/my')
    const orders = Array.isArray(response?.data?.orders) ? response.data.orders : Array.isArray(response?.data) ? response.data : []
    const result = {
      ...response,
      data: {
        ...(response.data || {}),
        orders,
      },
    }
    orderCache.orders = result
    orderCache.ordersTimestamp = now
    return result
  } catch (error: any) {
    if (isTemporaryError(error) && orderCache.orders) {
      return orderCache.orders
    }
    return { data: { orders: [] } }
  }
}

export async function getOrderDetail(id: string): Promise<{ data: { order: any } }> {
  try {
    const response = await api.get(`/orders/${id}`)
    return response
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { order: null } }
    }
    throw error
  }
}

export async function initiatePayment(payload: { orderId: string; method: string }): Promise<{ data: { reference: string } }> {
  try {
    const response = await api.post('/payments/initiate', payload)
    return response
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { reference: '' } }
    }
    throw error
  }
}

export async function verifyMtnWebhook(payload: any): Promise<{ data: any }> {
  try {
    return await api.post('/payments/webhook/mtn', payload)
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { ok: false } }
    }
    throw error
  }
}

// Orange Money payment integration
export async function initiateOrangePayment(payload: { orderId: string; phone: string; amount: number }): Promise<{ data: { reference: string } }> {
  try {
    const response = await api.post('/payments/orange/initiate', payload)
    return response
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { reference: '' } }
    }
    throw error
  }
}

export async function verifyOrangeWebhook(payload: any): Promise<{ data: any }> {
  try {
    return await api.post('/payments/webhook/orange', payload)
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { ok: false } }
    }
    throw error
  }
}

export async function updateOrderStatus(id: string, payload: { status: string }): Promise<{ data: { success: boolean } }> {
  try {
    const response = await api.put(`/orders/${id}/status`, payload)
    return response
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { success: false } }
    }
    throw error
  }
}

export async function getPaymentReceipt(id: string): Promise<{ data: { receiptUrl: string } }> {
  try {
    const response = await api.get(`/payments/${id}/receipt`)
    return response
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { receiptUrl: '' } }
    }
    throw error
  }
}

export async function getContracts(): Promise<{ data: { contracts: any[] } }> {
  try {
    const response = await api.get('/api/contracts')
    return {
      ...response,
      data: {
        ...(response.data || {}),
        contracts: Array.isArray(response.data?.contracts) ? response.data.contracts : Array.isArray(response.data) ? response.data : [],
      },
    }
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { contracts: [] } }
    }
    throw error
  }
}

export async function getContractDetail(id: string): Promise<{ data: any }> {
  try {
    return await api.get(`/api/contracts/${id}`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { contract: null } }
    }
    throw error
  }
}

export async function createContract(payload: any): Promise<{ data: any }> {
  try {
    return await api.post('/api/contracts', payload)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { contract: { id: 'local', ...payload } } }
    }
    throw error
  }
}

export async function payContract(id: string): Promise<{ data: any }> {
  try {
    return await api.post(`/api/contracts/${id}/pay`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { success: false } }
    }
    throw error
  }
}

export async function confirmDelivery(id: string): Promise<{ data: any }> {
  try {
    return await api.post(`/api/contracts/${id}/confirm-delivery`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { success: false } }
    }
    throw error
  }
}

export async function getContractStatus(id: string): Promise<{ data: any }> {
  try {
    return await api.get(`/api/contracts/${id}/status`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { status: 'pending' } }
    }
    throw error
  }
}

export async function createTraceabilityEntry(payload: any): Promise<{ data: any }> {
  try {
    return await api.post('/api/traceability', payload)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { entry: { ...payload, id: 'local-trace' } } }
    }
    throw error
  }
}

export async function getTraceabilityByQrCode(qrCode: string): Promise<{ data: any }> {
  try {
    return await api.get(`/api/traceability/${qrCode}`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { entry: { qrCode, productId: 'demo-product', productName: 'Lot local', location: 'Non renseigné', status: 'En attente' } } }
    }
    throw error
  }
}

export async function getTraceabilityHistoryByProduct(productId: string): Promise<{ data: any }> {
  try {
    return await api.get(`/api/traceability/product/${productId}`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { history: [] } }
    }
    throw error
  }
}

export default api
