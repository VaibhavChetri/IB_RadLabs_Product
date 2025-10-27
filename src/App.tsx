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
import DisableClients from './pages/DisableClients';
import MasterPlanListing from './pages/MasterPlanListing';
import TransitPlanListing from './pages/TransitPlanListing';
import SentTransitPlanListing from './pages/SentTransitPlanListing';
import SentInventoryListing from './pages/SentInventoryListing';
import ClientDispatchDetails from './pages/ClientDispatchDetails';
import ReceivedTransitPlanListing from './pages/ReceivedTransitPlanListing';
import ReceivedInventoryListing from './pages/ReceivedInventoryListing';
import ClientPickupDetails from './pages/ClientPickupDetails';
import CreateMasterPlan from './pages/CreateMasterPlan';
import EditMasterPlan from './pages/EditMasterPlan';
import FloatingLabelDemo from './pages/FloatingLabelDemo';
import ClientListing from './pages/ClientListing';
import ClientInventoryDetails from './pages/ClientInventoryDetails';
import InventoryListing from './pages/InventoryListing';
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
			console.log('🔍 App.tsx: userData.city_id:', userData?.city_id);
			console.log('🔍 App.tsx: userData.state_id:', userData?.state_id);
			console.log('🔍 App.tsx: userData.userTypeId:', userData?.userTypeId);

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
										<Route path='/clients/disable' element={<DisableClients />} />
										<Route
											path='/transit-plan/master-plan/listing'
											element={<MasterPlanListing />}
										/>
										<Route path='/transit-plan/listing' element={<TransitPlanListing />} />
										<Route path='/transit-plan/sent/plan' element={<SentTransitPlanListing />} />
										<Route path='/transit-plan/sent/inventory' element={<SentInventoryListing />} />
										<Route
											path='/transit-plan/sent/client-details/:clientLocationId/:facilityId'
											element={<ClientDispatchDetails />}
										/>
										<Route
											path='/transit-plan/received/plan'
											element={<ReceivedTransitPlanListing />}
										/>
										<Route
											path='/transit-plan/received/listing'
											element={<ReceivedInventoryListing />}
										/>
										<Route
											path='/transit-plan/received/details/:clientLocationId/:facilityId'
											element={<ClientPickupDetails />}
										/>
										<Route path='/transit-plan/master-plan/create' element={<CreateMasterPlan />} />
										<Route path='/transit-plan/master-plan/edit' element={<EditMasterPlan />} />
										<Route path='/floating-demo' element={<FloatingLabelDemo />} />
										<Route path='/kam/clients' element={<ClientListing />} />
										<Route path='/kam/clients/:clientId' element={<ClientInventoryDetails />} />
										<Route path='/kam/inventory' element={<InventoryListing />} />
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
