import React, { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ToastProvider from './components/ToastProvider'
import Home from './pages/Home/index'
import Onboarding from './pages/Onboarding/index'
import Profile from './pages/Profile/index'
import RoleSelection from './pages/RoleSelection/index'
import Auth from './pages/Auth/index'
import ProductCatalog from './pages/ProductCatalog/index'
import ProductDetail from './pages/ProductDetail/index'
import CreateOffer from './pages/CreateOffer/index'
import MarketDynamic from './pages/MarketDynamic/index'
import Cart from './pages/Cart/index'
import Checkout from './pages/Checkout/index'
import PricePredictions from './pages/PricePredictions/index'
import YieldPredictions from './pages/YieldPredictions/index'
import Recommendations from './pages/Recommendations/index'
import MyOrders from './pages/MyOrders/index'
import OrderDetail from './pages/OrderDetail/index'
import OrderTracking from './pages/OrderTracking/index'
import OrderHistory from './pages/OrderHistory/index'
import Contracts from './pages/Contracts/index'
import ContractCreate from './pages/ContractCreate/index'
import ContractDetail from './pages/ContractDetail/index'
import Traceability from './pages/Traceability/index'
import TraceabilityDetail from './pages/TraceabilityDetail/index'
import ProtectedRoute from './components/ProtectedRoute'
import Crowdfunding from './pages/Crowdfunding/index'
import ProjectDetail from './pages/ProjectDetail/index'
import Notifications from './pages/Notifications/index'
import Chat from './components/Chat'
import DashboardFarmer from './pages/DashboardFarmer/index'
import DashboardBuyer from './pages/DashboardBuyer/index'
import AdminPanel from './pages/AdminPanel/index'
import Predictions from './pages/Predictions/index'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const showModalBackground = location.pathname === '/auth' || location.pathname === '/role-selection'

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search])

  return (
    <ToastProvider>
      {showModalBackground ? <Onboarding /> : null}
      <Routes>
        <Route index element={<Onboarding />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="role-selection" element={<RoleSelection modal={showModalBackground} onClose={() => navigate('/onboarding')} />} />
        <Route path="auth" element={<Auth modal={showModalBackground} onClose={() => navigate('/onboarding')} />} />
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
