import { configureStore } from '@reduxjs/toolkit';
import {
	persistReducer,
	persistStore,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { themeSlice } from './slices/themeSlice';
import { authSlice } from './slices/authSlice';
import { dashboardSlice } from './slices/dashboardSlice';
import apiReducer from './slices/apiSlice';
import clientReducer from './slices/clientSlice';
import transitPlanReducer from './slices/transitPlanSlice';
import inventoryReducer from './slices/inventorySlice';
import kamReducer from './slices/kamSlice';
import skuMappingReducer from './slices/skuMappingSlice';
import skuListingReducer from './slices/skuListingSlice';
import revenueReducer from './slices/revenueSlice';
import { combineReducers } from '@reduxjs/toolkit';

// Configure redux-persist for SKU Listing
const skuListingPersistConfig = {
	key: 'skuListing',
	storage,
	whitelist: ['selectedClientId', 'selectedStatus'], // Only persist these fields
};

// Configure redux-persist for SKU Mapping
const skuMappingPersistConfig = {
	key: 'skuMapping',
	storage,
	whitelist: [
		'waterInefficiencyRows',
		'singleUsePpRows',
		'clamshellRows',
		'electricityConsumed',
		'waterConsumed',
		'srcingDistance',
		'qtyTransportedOneTrip',
		'selectedClientId',
		'selectedClient',
	],
};

// Configure redux-persist for Revenue
const revenuePersistConfig = {
	key: 'revenue',
	storage,
	whitelist: [
		'budgets',
		'onSiteManPowerEstimates',
		'lastUpdated',
		'editBudgetWeekValues',
		'editManPowerWeekValues',
		'editLastUpdated',
	],
};

// Configure redux-persist for KAM
const kamPersistConfig = {
	key: 'kam',
	storage,
	whitelist: ['selectedDate'], // Only persist selectedDate
};

// Combine all reducers
const rootReducer = combineReducers({
	theme: themeSlice.reducer,
	auth: authSlice.reducer,
	dashboard: dashboardSlice.reducer,
	api: apiReducer,
	client: clientReducer,
	transitPlan: transitPlanReducer,
	inventory: inventoryReducer,
	kam: persistReducer(kamPersistConfig, kamReducer),
	skuMapping: persistReducer(skuMappingPersistConfig, skuMappingReducer),
	skuListing: persistReducer(skuListingPersistConfig, skuListingReducer),
	revenue: persistReducer(revenuePersistConfig, revenueReducer),
});

export const store = configureStore({
	reducer: rootReducer,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
