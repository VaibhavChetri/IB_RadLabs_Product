import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import TokenManager from './utils/tokenManager';

function App() {
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
