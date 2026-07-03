import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import RoleSelection from './pages/RoleSelection'
import Auth from './pages/Auth'

export default function App() {
  return (
    <Routes>
      <Route index element={<Onboarding />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="role-selection" element={<RoleSelection />} />
      <Route path="auth" element={<Auth />} />
      <Route element={<MainLayout />}>
        <Route path="home" element={<Home />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}
