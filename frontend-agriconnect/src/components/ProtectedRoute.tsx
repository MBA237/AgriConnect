import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useSession from '../hooks/useSession'

export default function ProtectedRoute() {
  const { isAuthenticated } = useSession()

  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />
  }

  return <Outlet />
}
