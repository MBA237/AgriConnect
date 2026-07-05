import { useEffect, useMemo, useState } from 'react'

export type CartItem = {
  productId: string
  title: string
  price: number
  unit: string
  quantity: number
  image: string
  farmerName: string
}

const STORAGE_KEY = 'agriConnectCart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

export default function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCart())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }, [items])

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.productId === item.productId)
      const quantity = Math.max(1, item.quantity ?? 1)
      if (existingIndex >= 0) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        }
        return next
      }
      return [...prev, { ...item, quantity }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prev =>
      prev
        .map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
        .filter(item => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId))
  }

  const clearCart = () => {
    setItems([])
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  return {
    items,
    total,
    count,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }
}
