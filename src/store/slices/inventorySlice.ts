import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	WashingFacility,
	SentInventoryResponse,
	SentInventoryRow,
} from '../../services/inventoryApi';

export interface InventoryFilters {
	fromDate?: string;
	toDate?: string;
	selectedFacility?: number;
}

export interface InventoryState {
	// Data
	washingFacilities: WashingFacility[];
	sentInventoryData: SentInventoryResponse | null;
	tableData: SentInventoryRow[];

	// Filters
	filters: InventoryFilters;

	// Loading states
	loading: boolean;
	loadingFacilities: boolean;

	// Error handling
	error: string | null;

	// Pagination
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

const initialState: InventoryState = {
	washingFacilities: [],
	sentInventoryData: null,
	tableData: [],
	filters: {},
	loading: false,
	loadingFacilities: false,
	error: null,
	pagination: {
		currentPage: 1,
		pageSize: 10,
		totalItems: 0,
		totalPages: 0,
	},
};

export const inventorySlice = createSlice({
	name: 'inventory',
	initialState,
	reducers: {
		// Data actions
		setWashingFacilities: (state, action: PayloadAction<WashingFacility[]>) => {
			state.washingFacilities = action.payload;
		},

		setSentInventoryData: (state, action: PayloadAction<SentInventoryResponse>) => {
			state.sentInventoryData = action.payload;
			state.pagination.totalItems = action.payload.totalCount;
			state.pagination.totalPages = Math.ceil(
				action.payload.totalCount / state.pagination.pageSize
			);
		},

		setTableData: (state, action: PayloadAction<SentInventoryRow[]>) => {
			state.tableData = action.payload;
		},

		// Filter actions
		setFilters: (state, action: PayloadAction<InventoryFilters>) => {
			state.filters = { ...state.filters, ...action.payload };
		},

		clearFilters: state => {
			state.filters = {};
		},

		// Loading actions
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},

		setLoadingFacilities: (state, action: PayloadAction<boolean>) => {
			state.loadingFacilities = action.payload;
		},

		// Error actions
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},

		clearError: state => {
			state.error = null;
		},

		// Pagination actions
		setCurrentPage: (state, action: PayloadAction<number>) => {
			state.pagination.currentPage = action.payload;
		},

		setPageSize: (state, action: PayloadAction<number>) => {
			state.pagination.pageSize = action.payload;
			state.pagination.totalPages = Math.ceil(state.pagination.totalItems / action.payload);
		},

		// Reset actions
		resetInventoryState: () => initialState,
	},
});

export const {
	setWashingFacilities,
	setSentInventoryData,
	setTableData,
	setFilters,
	clearFilters,
	setLoading,
	setLoadingFacilities,
	setError,
	clearError,
	setCurrentPage,
	setPageSize,
	resetInventoryState,
} = inventorySlice.actions;

export default inventorySlice.reducer;
