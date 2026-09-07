import axios from 'axios'
import type { AuthMode } from './authFlow'
import { buildAuthRequestPayload, buildAuthVerifyPayload } from './authRequest'

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

export type RegisteredSeller = {
  id: string
  fullName: string
  email?: string
}

export type RegisteredUser = RegisteredSeller & { role: string }

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
  regions?: ZonePricePoint[]
  aiInsight?: string
}

export type PriceHistoryData = {
  timestamp: string
  price: number
  volume: number
}

export type ZonePricePoint = {
  zone: string
  price: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export type PriceZoneSeries = {
  productId: string
  productTitle: string
  category: string
  zones: ZonePricePoint[]
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
        // Keep the locally stored session active so the user can continue navigating normally.
        return Promise.reject(error)
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

type MarketSource = 'external' | 'api' | 'cache' | 'database-fallback' | 'external-unavailable' | 'fallback'

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
    profileImage: user?.profileImage || undefined,
    ...(user || {}),
  }
}

function normalizeProduct(product: any): Product {
  const price = Number(product?.price ?? product?.currentPrice ?? 0)
  const stock = Number(product?.stock ?? product?.quantity ?? 0)
  const images = Array.isArray(product?.images)
    ? product.images.filter((image: unknown): image is string => typeof image === 'string' && image.trim().length > 0)
    : typeof product?.image === 'string' && product.image.trim().length > 0
      ? [product.image]
      : []
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
    farmerName: product?.farmerName || product?.seller?.fullName || product?.seller?.email || 'Vendeur enregistré',
    ownerId: product?.ownerId || product?.sellerId || product?.seller?.id,
    publishedAt: product?.publishedAt || product?.createdAt,
    images,
  }
}

function normalizePriceData(item: any): PriceData {
  const currentPrice = Number(item?.currentPrice ?? item?.price ?? 0)
  const previousPrice = Number(item?.previousPrice ?? item?.price ?? currentPrice)
  const rawRegions = item?.regions ?? item?.zones ?? item?.regionalPrices ?? item?.regional_prices
  const regions = Array.isArray(rawRegions)
    ? rawRegions.map((region: any) => {
        const regionPrice = Number(region.price ?? region.currentPrice ?? region.current_price)
        const regionChange = Number(region.change ?? region.priceChangePercent ?? region.price_change_percent ?? 0)
        return {
          zone: String(region.zone ?? region.region ?? region.name ?? 'Zone inconnue'),
          price: Number.isFinite(regionPrice) ? regionPrice : 0,
          change: Number.isFinite(regionChange) ? regionChange : 0,
          trend: regionChange > 0 ? 'up' : regionChange < 0 ? 'down' : 'stable',
        } as ZonePricePoint
      }).filter((region: ZonePricePoint) => region.price > 0)
    : undefined
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
    regions,
    aiInsight: item?.aiInsight || item?.ai_insight || item?.forecast?.summary,
  }
}

function normalizeHistoryData(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.history)) return data.history
  return []
}

export function buildNationalZoneSeries(price: PriceData): PriceZoneSeries {
  const zones = price.regions ?? []

  return {
    productId: price.productId,
    productTitle: price.productTitle,
    category: price.category,
    zones,
  }
}

export function getPriceForZone(price: PriceData, zone?: string): { price: number; change: number; trend: PriceData['trend']; hasRegionalData: boolean } {
  if (!zone || zone === 'national') {
    return { price: price.currentPrice, change: price.priceChangePercent, trend: price.trend, hasRegionalData: false }
  }

  const regionalPrice = price.regions?.find(region => region.zone === zone)
  if (!regionalPrice) {
    return { price: price.currentPrice, change: price.priceChangePercent, trend: price.trend, hasRegionalData: false }
  }

  return {
    price: regionalPrice.price,
    change: regionalPrice.change,
    trend: regionalPrice.trend,
    hasRegionalData: true,
  }
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
  mode?: AuthMode
}): Promise<{ data: any }> {
  const backendPayload = buildAuthRequestPayload({
    deliveryMethod: payload.deliveryMethod,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    mode: payload.mode,
  })

  try {
    return await api.post('/auth/request-otp', backendPayload)
  } catch (error: any) {
    throw error
  }
}

export async function verifyOtp(payload: { deliveryMethod: 'email' | 'phone'; email?: string; phone?: string; code: string; mode?: AuthMode; role?: string; firstName?: string; lastName?: string; password?: string }): Promise<{ data: any }> {
  const backendPayload = buildAuthVerifyPayload({
    deliveryMethod: payload.deliveryMethod,
    email: payload.email,
    phone: payload.phone,
    code: payload.code,
    mode: payload.mode,
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
    password: payload.password,
  })

  try {
    const response = await api.post(payload.mode === 'login' ? '/auth/login' : '/auth/verify-otp', backendPayload)
    const token = response?.data?.accessToken || response?.data?.token || response?.data?.access_token || null
    const normalizedEmail = response?.data?.user?.email || payload.email || (payload.phone ? `${String(payload.phone).replace(/\D/g, '')}@agriconnect.local` : '')
    return {
      ...response,
      data: {
        ...response.data,
        token,
        user: normalizeUser(response.data?.user, normalizedEmail),
      },
    }
  } catch (error: any) {
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
    profileImage: payload.profileImage ?? null,
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

export async function getRegisteredSellers(search = ''): Promise<{ data: { sellers: RegisteredSeller[] } }> {
  const response = await api.get('/auth/sellers', { params: search.trim() ? { search: search.trim() } : undefined })
  return {
    ...response,
    data: {
      ...(response.data || {}),
      sellers: Array.isArray(response.data?.sellers) ? response.data.sellers : [],
    },
  }
}

export async function getRegisteredUsers(search = ''): Promise<{ data: { users: RegisteredUser[] } }> {
  const response = await api.get('/auth/users', { params: search.trim() ? { search: search.trim() } : undefined })
  return {
    ...response,
    data: {
      ...(response.data || {}),
      users: Array.isArray(response.data?.users) ? response.data.users : [],
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
        meta: buildMarketMeta(
          response.data?.meta?.source === 'external'
            ? 'external'
            : response.data?.meta?.source === 'database-fallback'
              ? 'database-fallback'
              : response.data?.meta?.source === 'external-unavailable'
                ? 'external-unavailable'
              : 'api',
          response.data?.meta?.message,
        ),
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

export async function getUserStats(userId?: string): Promise<{ data: { rating: number | null; totalSales: number; contracts: number; memberSinceYears: number | null } }> {
  const [profile, ordersResponse, contractsResponse, productsResponse] = await Promise.all([
    me().catch(() => null),
    getMyOrders(),
    getContracts(),
    getProducts(),
  ])
  const createdAt = profile?.data?.createdAt
  const createdTimestamp = createdAt ? new Date(createdAt).getTime() : NaN
  const years = Number.isFinite(createdTimestamp)
    ? Math.max(0, Math.floor((Date.now() - createdTimestamp) / (1000 * 60 * 60 * 24 * 365)))
    : null
  const role = profile?.data?.role
  const totalSales = role === 'agriculteur' ? productsResponse.data.products.length : ordersResponse.data.orders.length
  return {
    data: {
      rating: null,
      totalSales,
      contracts: contractsResponse.data.contracts.length,
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
    const response = await api.get('/contracts')
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
    return await api.get(`/contracts/${id}`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { contract: null } }
    }
    throw error
  }
}

export async function createContract(payload: any): Promise<{ data: any }> {
  try {
    return await api.post('/contracts', payload)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { contract: { id: 'local', ...payload } } }
    }
    throw error
  }
}

export async function payContract(id: string): Promise<{ data: any }> {
  try {
    return await api.post(`/contracts/${id}/pay`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { success: false } }
    }
    throw error
  }
}

export async function confirmDelivery(id: string): Promise<{ data: any }> {
  try {
    return await api.post(`/contracts/${id}/confirm-delivery`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { success: false } }
    }
    throw error
  }
}

export async function getContractStatus(id: string): Promise<{ data: any }> {
  try {
    return await api.get(`/contracts/${id}/status`)
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.code === 'ERR_NETWORK') {
      return { data: { status: 'pending' } }
    }
    throw error
  }
}

export async function createTraceabilityEntry(payload: any): Promise<{ data: any }> {
  return await api.post('/traceability', payload)
}

export async function getTraceabilityByQrCode(qrCode: string): Promise<{ data: any }> {
  return await api.get(`/traceability/${encodeURIComponent(qrCode)}`)
}

export async function getTraceabilityHistoryByProduct(productId: string): Promise<{ data: any }> {
  const path = productId ? `/traceability/product/${encodeURIComponent(productId)}` : '/traceability/product/all'
  return await api.get(path)
}

// Crowdfunding helpers
export type CrowdfundProject = {
  id: string
  title: string
  description?: string
  summary?: string
  goal: number
  raised: number
  owner?: string
  deadline?: string
  image?: string
  category?: string
  sector?: string
  location?: string
  status?: string
  area?: string
  irrigation?: string
  greenhouse?: string
  investorsCount?: number
  returnRate?: string | number
  minimumInvestment?: number
  currency?: string
  tags?: string[]
  details?: string[]
}

const emptyProjects: CrowdfundProject[] = []

export async function getCrowdfundingProjects(): Promise<{ data: { projects: CrowdfundProject[] } }> {
  if (!hasStoredSession()) {
    return { data: { projects: [] } }
  }

  try {
    const response = await api.get('/crowdfunding/projects')
    const items = Array.isArray(response?.data) ? response.data : response.data?.projects || []
    return { ...response, data: { projects: items } }
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { projects: emptyProjects } }
    }
    return { data: { projects: [] } }
  }
}

export async function getCrowdfundingProject(id: string): Promise<{ data: { project: CrowdfundProject | null } }> {
  if (!hasStoredSession()) {
    return { data: { project: null } }
  }

  try {
    const response = await api.get(`/crowdfunding/projects/${id}`)
    return { ...response, data: { project: response.data?.project || response.data || null } }
  } catch (error: any) {
    if (isTemporaryError(error)) {
      const p = emptyProjects.find(s => s.id === id) || null
      return { data: { project: p } }
    }
    return { data: { project: null } }
  }
}

export async function createCrowdfundingProject(payload: { title: string; description: string; goal: number; deadline?: string; category?: string; location?: string; image: string }): Promise<{ data: { project: CrowdfundProject } }> {
  return await api.post('/crowdfunding/projects', payload)
}

export async function investInProject(payload: { projectId: string; amount: number }): Promise<{ data: any }> {
  if (!hasStoredSession()) {
    return { data: { success: true, invested: payload.amount } }
  }

  try {
    return await api.post('/crowdfunding/invest', payload)
  } catch (error: any) {
    if (isTemporaryError(error)) {
      return { data: { success: false } }
    }
    throw error
  }
}

export async function getMyInvestments(): Promise<{ data: { investments: any[] } }> {
  if (!hasStoredSession()) return { data: { investments: [] } }
  try {
    const res = await api.get('/crowdfunding/my-investments')
    const items = Array.isArray(res?.data) ? res.data : res.data?.investments || []
    return { ...res, data: { investments: items } }
  } catch (error: any) {
    if (isTemporaryError(error)) return { data: { investments: [] } }
    throw error
  }
}

// Analytics & Admin helpers
export async function getAnalyticsFarmer(): Promise<{ data: any }> {
  try {
    const res = await api.get('/analytics/farmer')
    return res
  } catch (error: any) {
    return { data: { revenue30d: 125000, revenueDelta: 8.4, volumeSold: 4200, volumeDelta: 2.1, activeContracts: 3, rating: 4.6 } }
  }
}

export async function getAnalyticsBuyer(): Promise<{ data: any }> {
  try {
    const res = await api.get('/analytics/buyer')
    return res
  } catch (error: any) {
    return { data: { spend30d: 82000, spendDelta: -3.2, ordersCount: 18, activeSuppliers: 5, savings: 1200 } }
  }
}

export async function getAnalyticsAdmin(): Promise<{ data: any }> {
  try {
    const res = await api.get('/analytics/admin')
    return res
  } catch (error: any) {
    return { data: { usersCount: 1240, productsCount: 842, transactionsCount: 5320, revenueSeries: [5, 8, 6, 9, 12, 10] } }
  }
}

export async function getAdminUsers(): Promise<{ data: { users: any[] } }> {
  try {
    const res = await api.get('/admin/users')
    const items = Array.isArray(res?.data) ? res.data : res.data?.users || []
    return { ...res, data: { users: items } }
  } catch (error: any) {
    return { data: { users: [ { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'admin', active: true }, { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'farmer', active: true } ] } }
  }
}

export async function updateAdminUser(id: string, payload: any) {
  try {
    return await api.put(`/admin/users/${id}`, payload)
  } catch (error: any) {
    return { data: { user: { id, ...payload } } }
  }
}

export async function moderateProduct(payload: { productId: string; action: string }) {
  try {
    return await api.put('/admin/products/moderate', payload)
  } catch (error: any) {
    return { data: { ok: true } }
  }
}

export async function getNotifications(): Promise<{ data: { notifications: any[] } }> {
  try {
    const res = await api.get('/notifications')
    const items = Array.isArray(res?.data) ? res.data : res.data?.notifications || []
    return { ...res, data: { notifications: items } }
  } catch (error: any) {
    return { data: { notifications: [
      { id: 'n1', title: 'Bienvenue', body: 'Merci de tester AgriConnect', read: false, ts: new Date().toISOString() },
      { id: 'n2', title: 'Contrat expiring', body: 'Un contrat arrive à échéance', read: true, ts: new Date().toISOString() }
    ] } }
  }
}

export async function createNotification(payload: { title: string; body: string }) {
  try {
    const res = await api.post('/notifications', payload)
    return res
  } catch (error) {
    const n = { id: 'local-' + Date.now(), title: payload.title, body: payload.body, read: false, ts: new Date().toISOString() }
    return { data: { notification: n } }
  }
}

export async function getChatMessages(opts?: { room?: string }) {
  try {
    const res = await api.get('/chat/messages', { params: opts })
    return res
  } catch (error) {
    return { data: { messages: [ { id: 'm1', from: 'system', text: 'Bienvenue sur le chat', ts: new Date().toISOString() } ] } }
  }
}

export async function sendChatMessage(payload: { room?: string; text: string }) {
  try {
    const res = await api.post('/chat/messages', payload)
    return res
  } catch (error) {
    return { data: { ok: true } }
  }
}

export default api
