import { configureStore } from '@reduxjs/toolkit';
import { themeSlice } from './slices/themeSlice';
import { authSlice } from './slices/authSlice';
import { dashboardSlice } from './slices/dashboardSlice';
import apiReducer from './slices/apiSlice';
import clientReducer from './slices/clientSlice';
import transitPlanReducer from './slices/transitPlanSlice';

export const store = configureStore({
	reducer: {
		theme: themeSlice.reducer,
		auth: authSlice.reducer,
		dashboard: dashboardSlice.reducer,
		api: apiReducer,
		client: clientReducer,
		transitPlan: transitPlanReducer,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST'],
			},
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
