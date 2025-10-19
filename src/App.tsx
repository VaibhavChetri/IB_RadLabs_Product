import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { MenuManagement } from './pages/MenuManagement';
import { AddClient } from './pages/AddClient';
import { EditClient } from './pages/EditClient';
import { ManageClients } from './pages/ManageClients';
import FloatingLabelDemo from './pages/FloatingLabelDemo';
import { ProtectedRoute } from './components/ProtectedRoute';
import TokenManager from './utils/tokenManager';
import { restoreAuth, initializeAuth } from './store/slices/authSlice';

function App() {
	const dispatch = useDispatch();

	// Restore auth state on page load
	useEffect(() => {
		console.log('App.tsx: Checking auth restoration...');
		const tokenData = TokenManager.getTokenData();
		console.log('Token data:', tokenData);
		console.log('Is authenticated:', TokenManager.isAuthenticated());

		if (tokenData && TokenManager.isAuthenticated()) {
			console.log('Restoring auth state...');
			// Restore user data from localStorage (stored during login)
			const userData = TokenManager.getUserData();
			const menuPermissions = TokenManager.getMenuPermissions();

			console.log('Retrieved userData:', userData);
			console.log('Retrieved menuPermissions:', menuPermissions);

			const user = {
				id: userData?.id || 'Unknown',
				name: userData?.name || 'Unknown User',
				email: userData?.email || 'unknown@example.com',
				role: userData?.role || 'Unknown Role',
				userTypeId: userData?.userTypeId || 0,
				menuPermissions: menuPermissions || {},
			};
			console.log('Restoring user with menu permissions:', user);
			dispatch(restoreAuth(user));
		} else {
			console.log('No valid auth found, marking as initialized');
			dispatch(initializeAuth());
		}
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
									<Routes>
										<Route path='/' element={<Dashboard />} />
										<Route path='/menu-management' element={<MenuManagement />} />
										<Route path='/clients/add' element={<AddClient />} />
										<Route path='/clients/edit' element={<EditClient />} />
										<Route path='/clients/manage' element={<ManageClients />} />
										<Route path='/floating-demo' element={<FloatingLabelDemo />} />
									</Routes>
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
