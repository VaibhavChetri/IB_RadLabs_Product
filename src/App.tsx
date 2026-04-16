import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import TokenManager from './utils/tokenManager';
import { restoreAuth, initializeAuth } from './store/slices/authSlice';
import { MenuApiService } from './services/menuApi';
import { AppRoutes } from './routes';

function App() {
	const dispatch = useDispatch();

	// Restore auth state on page load
	useEffect(() => {
		const fetchAuthData = async () => {
			const tokenData = TokenManager.getTokenData();

			if (tokenData && TokenManager.isAuthenticated()) {
				// Restore user data from localStorage (stored during login)
				const userData = TokenManager.getUserData();

				// Fetch fresh menu permissions from API
				let menuPermissions = {};
				try {
					const response = await MenuApiService.getUserMenuPermissions();
					menuPermissions = response.data?.menu_permissions || {};
				} catch (error) {
					console.error('Failed to fetch menu permissions, using localStorage:', error);
					menuPermissions = TokenManager.getMenuPermissions() || {};
				}

				const user = {
					id: userData?.id || 'Unknown',
					name: userData?.name || 'Unknown User',
					email: userData?.email || 'unknown@example.com',
					role: userData?.role || 'Unknown Role',
					userTypeId: userData?.userTypeId || 0,
					userTypeName: userData?.userTypeName || 'Unknown',
					city_id: userData?.city_id || undefined,
					city_name: userData?.city_name || undefined,
					state_id: userData?.state_id || undefined,
					state_name: userData?.state_name || undefined,
					menuPermissions: menuPermissions || {},
					isApprover: userData?.isApprover ?? false,
				};
				dispatch(restoreAuth(user));
			} else {
				dispatch(initializeAuth());
			}
		};

		fetchAuthData();
	}, [dispatch]);

	// Track user activity
	useEffect(() => {
		const handleUserActivity = () => {
			TokenManager.updateUserActivity();
		};

		// Add event listeners for user activity
		const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
		events.forEach(event => {
			document.addEventListener(event, handleUserActivity, true);
		});

		// Initialize token monitoring
		TokenManager.initialize();

		// Cleanup
		return () => {
			events.forEach(event => {
				document.removeEventListener(event, handleUserActivity, true);
			});
		};
	}, []);

	return (
		<Router>
			<div className='min-h-screen bg-background-default'>
				<Routes>
					<Route path='/login' element={<Login />} />
					<Route
						path='/*'
						element={
							<ProtectedRoute>
								<Layout>
									<AppRoutes />
								</Layout>
							</ProtectedRoute>
						}
					/>
				</Routes>
			</div>
		</Router>
	);
}

export default App;
