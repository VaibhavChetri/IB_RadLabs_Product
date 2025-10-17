import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';
import TokenManager from '../utils/tokenManager';

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

	// Check both Redux state and token validity
	const isTokenValid = TokenManager.isAuthenticated();

	console.log('ProtectedRoute: Redux isAuthenticated:', isAuthenticated);
	console.log('ProtectedRoute: Redux isInitialized:', isInitialized);
	console.log('ProtectedRoute: TokenManager isAuthenticated:', isTokenValid);

	// Don't redirect until auth has been initialized
	if (!isInitialized) {
		console.log('ProtectedRoute: Auth not initialized yet, waiting...');
		return <div>Loading...</div>; // Or a proper loading component
	}

	if (!isAuthenticated || !isTokenValid) {
		console.log('ProtectedRoute: Redirecting to login');
		return <Navigate to='/login' replace />;
	}

	console.log('ProtectedRoute: Allowing access');
	return <>{children}</>;
};
