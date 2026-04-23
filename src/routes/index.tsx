import { Routes, Route } from 'react-router-dom';
import { routes } from '../config/routes.tsx';

export const AppRoutes = () => {
	return (
		<Routes>
			{routes.map(route => (
				<Route key={route.path} path={route.path} element={<route.component />} />
			))}
		</Routes>
	);
};
