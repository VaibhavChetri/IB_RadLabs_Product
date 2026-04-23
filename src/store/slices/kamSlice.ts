import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClientPlanRow, ClientInventoryRow, InventoryValueRow } from '../../services/kamApi';

interface KamState {
	selectedDate: string; // Selected date for client listing and inventory details
	clientListing: {
		data: ClientPlanRow[];
		stats: { pending: number; total: number; display: string };
		pagination: { page: number; limit: number; totalItems: number; totalPages: number };
		loading: boolean;
	};
	clientInventory: {
		data: ClientInventoryRow[];
		loading: boolean;
	};
	inventoryListing: {
		data: InventoryValueRow[];
		totals: { totalDispatch: string; totalReturned: string };
		pagination: { page: number; limit: number; totalItems: number; totalPages: number };
		loading: boolean;
	};
}

const initialState: KamState = {
	selectedDate: new Date().toISOString().split('T')[0], // Default to today
	clientListing: {
		data: [],
		stats: { pending: 0, total: 0, display: '0/0' },
		pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
		loading: false,
	},
	clientInventory: { data: [], loading: false },
	inventoryListing: {
		data: [],
		totals: { totalDispatch: '0', totalReturned: '0' },
		pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
		loading: false,
	},
};

const kamSlice = createSlice({
	name: 'kam',
	initialState,
	reducers: {
		setSelectedDate: (state, action: PayloadAction<string>) => {
			state.selectedDate = action.payload;
		},
		setClientListing: (state, action: PayloadAction<KamState['clientListing']>) => {
			state.clientListing = action.payload;
		},
		setClientInventory: (state, action: PayloadAction<ClientInventoryRow[]>) => {
			state.clientInventory.data = action.payload;
		},
		setInventoryListing: (state, action: PayloadAction<KamState['inventoryListing']>) => {
			state.inventoryListing = action.payload;
		},
		setClientListingLoading: (state, action: PayloadAction<boolean>) => {
			state.clientListing.loading = action.payload;
		},
		setClientInventoryLoading: (state, action: PayloadAction<boolean>) => {
			state.clientInventory.loading = action.payload;
		},
		setInventoryListingLoading: (state, action: PayloadAction<boolean>) => {
			state.inventoryListing.loading = action.payload;
		},
	},
});

export const {
	setSelectedDate,
	setClientListing,
	setClientInventory,
	setInventoryListing,
	setClientListingLoading,
	setClientInventoryLoading,
	setInventoryListingLoading,
} = kamSlice.actions;

export default kamSlice.reducer;
