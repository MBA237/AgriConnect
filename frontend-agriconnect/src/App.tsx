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
import PricePredictions from './pages/PricePredictions'
import YieldPredictions from './pages/YieldPredictions'
import Recommendations from './pages/Recommendations'
import MyOrders from './pages/MyOrders'
import OrderDetail from './pages/OrderDetail'
import OrderTracking from './pages/OrderTracking'
import OrderHistory from './pages/OrderHistory'
import Contracts from './pages/Contracts'
import ContractCreate from './pages/ContractCreate'
import ContractDetail from './pages/ContractDetail'
import Traceability from './pages/Traceability'
import TraceabilityDetail from './pages/TraceabilityDetail'
import ProtectedRoute from './components/ProtectedRoute'
import Crowdfunding from './pages/Crowdfunding'
import ProjectDetail from './pages/ProjectDetail'
import Notifications from './pages/Notifications'
import Chat from './components/Chat'
import DashboardFarmer from './pages/DashboardFarmer'
import DashboardBuyer from './pages/DashboardBuyer'
import AdminPanel from './pages/AdminPanel'
import Predictions from './pages/Predictions'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route index element={<Onboarding />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="role-selection" element={<RoleSelection />} />
        <Route path="auth" element={<Auth />} />
        <Route element={<ProtectedRoute />}>
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
            <Route path="contracts" element={<Contracts />} />
            <Route path="contracts/new" element={<ContractCreate />} />
            <Route path="contracts/:id" element={<ContractDetail />} />
            <Route path="traceability" element={<Traceability />} />
            <Route path="traceability/:qrCode" element={<TraceabilityDetail />} />
            <Route path="crowdfunding" element={<Crowdfunding />} />
            <Route path="crowdfunding/:id" element={<ProjectDetail />} />
            <Route path="dashboard/farmer" element={<DashboardFarmer />} />
            <Route path="dashboard/buyer" element={<DashboardBuyer />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="chat" element={<Chat />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="predictions/price" element={<PricePredictions />} />
            <Route path="predictions/yield" element={<YieldPredictions />} />
            <Route path="predictions/recommendations" element={<Recommendations />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  )
}
