import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ToastProvider from './components/ToastProvider'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import RoleSelection from './pages/RoleSelection'
import Auth from './pages/Auth'
import ProductCatalog from './pages/ProductCatalog'
import ProductDetail from './pages/ProductDetail'
import CreateOffer from './pages/CreateOffer'
import MarketDynamic from './pages/MarketDynamic'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import OrderTracking from './pages/OrderTracking'
import OrderHistory from './pages/OrderHistory'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route index element={<Onboarding />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="role-selection" element={<RoleSelection />} />
        <Route path="auth" element={<Auth />} />
        <Route element={<MainLayout />}>
          <Route path="home" element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="catalog" element={<ProductCatalog />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="offers/new" element={<CreateOffer />} />
          <Route path="offers/edit/:id" element={<CreateOffer />} />
          <Route path="market" element={<MarketDynamic />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders/my" element={<MyOrders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="orders/:id/track" element={<OrderTracking />} />
          <Route path="orders" element={<OrderHistory />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
