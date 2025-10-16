import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { RootState } from '../store'
import TokenManager from '../utils/tokenManager'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  
  // Check both Redux state and token validity
  const isTokenValid = TokenManager.isAuthenticated()

  if (!isAuthenticated || !isTokenValid) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

