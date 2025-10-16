import { configureStore } from '@reduxjs/toolkit';
import { themeSlice } from './slices/themeSlice';
import { authSlice } from './slices/authSlice';
import { dashboardSlice } from './slices/dashboardSlice';

export const store = configureStore({
	reducer: {
		theme: themeSlice.reducer,
		auth: authSlice.reducer,
		dashboard: dashboardSlice.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST'],
			},
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
