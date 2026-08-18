import React from 'react'
import './ProtectedRoute.css'
import { Navigate, Outlet } from 'react-router-dom'
import useSession from '../hooks/useSession'

export default function ProtectedRoute() {
  const { isAuthenticated } = useSession()

  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
