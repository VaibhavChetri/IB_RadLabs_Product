import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RevenueState {
	budgets: Record<number, string>; // Map of costing_type_id to budget value
	onSiteManPowerEstimates: Record<number, string>; // Map of client_id to estimate value
	lastUpdated: {
		date_year: string | null;
		facility_id: number | null;
	};
	// Edit page state
	editBudgetWeekValues: Record<number, { week1: string; week2: string; week3: string; week4: string }>; // Map of record_id to week values
	editManPowerWeekValues: Record<number, { week1: string; week2: string; week3: string; week4: string }>; // Map of client_id to week values
	editLastUpdated: {
		month: string | null;
		year: string | null;
		facility_id: string | null;
	};
}

const initialState: RevenueState = {
	budgets: {},
	onSiteManPowerEstimates: {},
	lastUpdated: {
		date_year: null,
		facility_id: null,
	},
	editBudgetWeekValues: {},
	editManPowerWeekValues: {},
	editLastUpdated: {
		month: null,
		year: null,
		facility_id: null,
	},
};

const revenueSlice = createSlice({
	name: 'revenue',
	initialState,
	reducers: {
		setBudget: (
			state,
			action: PayloadAction<{ costingTypeId: number; value: string }>
		) => {
			state.budgets[action.payload.costingTypeId] = action.payload.value;
		},
		setBudgets: (state, action: PayloadAction<Record<number, string>>) => {
			state.budgets = { ...state.budgets, ...action.payload };
		},
		setOnSiteManPowerEstimate: (
			state,
			action: PayloadAction<{ clientId: number; value: string }>
		) => {
			state.onSiteManPowerEstimates[action.payload.clientId] = action.payload.value;
		},
		setOnSiteManPowerEstimates: (
			state,
			action: PayloadAction<Record<number, string>>
		) => {
			state.onSiteManPowerEstimates = {
				...state.onSiteManPowerEstimates,
				...action.payload,
			};
		},
		setLastUpdated: (
			state,
			action: PayloadAction<{ date_year: string; facility_id: number }>
		) => {
			state.lastUpdated = action.payload;
		},
		setEditBudgetWeekValue: (
			state,
			action: PayloadAction<{ recordId: number; week: 'week1' | 'week2' | 'week3' | 'week4'; value: string }>
		) => {
			if (!state.editBudgetWeekValues[action.payload.recordId]) {
				state.editBudgetWeekValues[action.payload.recordId] = {
					week1: '',
					week2: '',
					week3: '',
					week4: '',
				};
			}
			state.editBudgetWeekValues[action.payload.recordId][action.payload.week] = action.payload.value;
		},
		setEditBudgetWeekValues: (
			state,
			action: PayloadAction<Record<number, { week1: string; week2: string; week3: string; week4: string }>>
		) => {
			state.editBudgetWeekValues = { ...state.editBudgetWeekValues, ...action.payload };
		},
		setEditManPowerWeekValue: (
			state,
			action: PayloadAction<{ clientId: number; week: 'week1' | 'week2' | 'week3' | 'week4'; value: string }>
		) => {
			if (!state.editManPowerWeekValues[action.payload.clientId]) {
				state.editManPowerWeekValues[action.payload.clientId] = {
					week1: '',
					week2: '',
					week3: '',
					week4: '',
				};
			}
			state.editManPowerWeekValues[action.payload.clientId][action.payload.week] = action.payload.value;
		},
		setEditManPowerWeekValues: (
			state,
			action: PayloadAction<Record<number, { week1: string; week2: string; week3: string; week4: string }>>
		) => {
			state.editManPowerWeekValues = { ...state.editManPowerWeekValues, ...action.payload };
		},
		setEditLastUpdated: (
			state,
			action: PayloadAction<{ month: string; year: string; facility_id: string }>
		) => {
			state.editLastUpdated = action.payload;
		},
		clearRevenueData: state => {
			state.budgets = {};
			state.onSiteManPowerEstimates = {};
			state.lastUpdated = {
				date_year: null,
				facility_id: null,
			};
		},
		clearEditRevenueData: state => {
			state.editBudgetWeekValues = {};
			state.editManPowerWeekValues = {};
			state.editLastUpdated = {
				month: null,
				year: null,
				facility_id: null,
			};
		},
	},
});

export const {
	setBudget,
	setBudgets,
	setOnSiteManPowerEstimate,
	setOnSiteManPowerEstimates,
	setLastUpdated,
	setEditBudgetWeekValue,
	setEditBudgetWeekValues,
	setEditManPowerWeekValue,
	setEditManPowerWeekValues,
	setEditLastUpdated,
	clearRevenueData,
	clearEditRevenueData,
} = revenueSlice.actions;

export default revenueSlice.reducer;

