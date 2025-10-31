import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, persistor } from './store';
import App from './App';
import './index.css';

// Configure React Query with sensible defaults
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
			gcTime: 10 * 60 * 1000, // 10 minutes - cache duration
			refetchOnWindowFocus: false, // Don't refetch on window focus
			refetchOnReconnect: true, // Refetch on reconnect
			retry: 3, // Retry failed requests 3 times
			retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
		},
	},
});

createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<Provider store={store}>
				<PersistGate loading={null} persistor={persistor}>
					<App />
				</PersistGate>
			</Provider>
		</QueryClientProvider>
	</React.StrictMode>
);
