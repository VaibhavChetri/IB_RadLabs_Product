import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MasterPlan {
	id: number;
	vehicle_id?: number;
	vehicle_number: string | null;
	transit_date: string;
	transit_time: string;
	driver_name: string;
	driver_phone: string;
	created_by: string;
	city_name: string;
	vehicle_type: string;
	restaurant_name: string;
	restaurant_id?: number;
	facility_id?: number;
	type: string;
	facility: string;
	transit_type_id?: number;
	city_id?: number;
	sun?: number; // 0 or 1
	mon?: number; // 0 or 1
	tue?: number; // 0 or 1
	wed?: number; // 0 or 1
	thu?: number; // 0 or 1
	fri?: number; // 0 or 1
	sat?: number; // 0 or 1
	days?: number[]; // Array of day numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
}

export interface TransitPlanFilters {
	facility_id?: string;
	client_id?: string;
	transit_type_id?: string;
}

export interface TransitPlanState {
	// Master Plan data
	masterPlans: MasterPlan[];
	editMasterPlanData: MasterPlan | null;

	// Filters
	filters: TransitPlanFilters;

	// Loading states
	loading: boolean;
	submitting: boolean;

	// Error handling
	error: string | null;

	// Pagination
	pagination: {
		pageNumber: number;
		pageSize: number;
		totalItems: number;
	};
}

const initialState: TransitPlanState = {
	masterPlans: [],
	editMasterPlanData: null,
	filters: {},
	loading: false,
	submitting: false,
	error: null,
	pagination: {
		pageNumber: 1,
		pageSize: 10,
		totalItems: 0,
	},
};

export const transitPlanSlice = createSlice({
	name: 'transitPlan',
	initialState,
	reducers: {
		// Master Plan actions
		setMasterPlans: (state, action: PayloadAction<MasterPlan[]>) => {
			state.masterPlans = action.payload;
		},

		setEditMasterPlanData: (state, action: PayloadAction<MasterPlan>) => {
			state.editMasterPlanData = action.payload;
		},

		updateEditMasterPlanData: (
			state,
			action: PayloadAction<{ field: string; value: string | number | number[] | undefined | null }>
		) => {
			if (state.editMasterPlanData) {
				state.editMasterPlanData = {
					...state.editMasterPlanData,
					[action.payload.field]: action.payload.value,
				};
			}
		},

		clearEditMasterPlanData: state => {
			state.editMasterPlanData = null;
		},

		// Filter actions
		setFilters: (state, action: PayloadAction<TransitPlanFilters>) => {
			state.filters = { ...state.filters, ...action.payload };
		},

		clearFilters: state => {
			state.filters = {};
		},

		// Loading actions
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},

		setSubmitting: (state, action: PayloadAction<boolean>) => {
			state.submitting = action.payload;
		},

		// Error actions
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},

		clearError: state => {
			state.error = null;
		},

		// Pagination actions
		setPagination: (state, action: PayloadAction<Partial<TransitPlanState['pagination']>>) => {
			state.pagination = { ...state.pagination, ...action.payload };
		},

		setPageNumber: (state, action: PayloadAction<number>) => {
			state.pagination.pageNumber = action.payload;
		},

		setPageSize: (state, action: PayloadAction<number>) => {
			state.pagination.pageSize = action.payload;
		},

		setTotalItems: (state, action: PayloadAction<number>) => {
			state.pagination.totalItems = action.payload;
		},
	},
});

export const {
	// Master Plan exports
	setMasterPlans,
	setEditMasterPlanData,
	updateEditMasterPlanData,
	clearEditMasterPlanData,

	// Filter exports
	setFilters,
	clearFilters,

	// Loading exports
	setLoading,
	setSubmitting,

	// Error exports
	setError,
	clearError,

	// Pagination exports
	setPagination,
	setPageNumber,
	setPageSize,
	setTotalItems,
} = transitPlanSlice.actions;

export default transitPlanSlice.reducer;
