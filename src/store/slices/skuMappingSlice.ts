import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SkuMappingRow {
	id: number;
	containerTypeId: number;
	containerType: string;
	status: string;
	price: string;
	selectSku: boolean;
	distanceFromWarehouse?: string;
	platesWashedPerCycle?: string;
	disposableWeight?: string;
	qtyTransportedOneEv?: string;
	weight?: string;
	numberOfClamshell?: string;
}

interface SkuMappingState {
	selectedClient: any | null;
	selectedClientId: number | null;
	waterInefficiencyRows: SkuMappingRow[];
	singleUsePpRows: SkuMappingRow[];
	clamshellRows: SkuMappingRow[];
	electricityConsumed: string;
	waterConsumed: string;
	srcingDistance: string;
	qtyTransportedOneTrip: string;
	isClientLocked: boolean;
	shouldAddDefaultRow: boolean; // NEW: Flag to indicate if default row should be added
}

const initialState: SkuMappingState = {
	selectedClient: null,
	selectedClientId: null,
	waterInefficiencyRows: [],
	singleUsePpRows: [],
	clamshellRows: [],
	electricityConsumed: '0.4840',
	waterConsumed: '4',
	srcingDistance: '',
	qtyTransportedOneTrip: '',
	isClientLocked: false,
	shouldAddDefaultRow: false,
};

const skuMappingSlice = createSlice({
	name: 'skuMapping',
	initialState,
	reducers: {
		setSelectedClient: (
			state,
			action: PayloadAction<{ client: any | null; clientId: number | null }>
		) => {
			state.selectedClient = action.payload.client;
			state.selectedClientId = action.payload.clientId;
		},
		addWaterInefficiencyRow: (state, action: PayloadAction<SkuMappingRow>) => {
			state.waterInefficiencyRows.push(action.payload);
		},
		addSingleUsePpRow: (state, action: PayloadAction<SkuMappingRow>) => {
			state.singleUsePpRows.push(action.payload);
		},
		addClamshellRow: (state, action: PayloadAction<SkuMappingRow>) => {
			state.clamshellRows.push(action.payload);
		},
		removeWaterInefficiencyRow: (state, action: PayloadAction<number>) => {
			state.waterInefficiencyRows = state.waterInefficiencyRows.filter(
				row => row.id !== action.payload
			);
		},
		removeSingleUsePpRow: (state, action: PayloadAction<number>) => {
			state.singleUsePpRows = state.singleUsePpRows.filter(row => row.id !== action.payload);
		},
		removeClamshellRow: (state, action: PayloadAction<number>) => {
			state.clamshellRows = state.clamshellRows.filter(row => row.id !== action.payload);
		},
		updateWaterInefficiencyRow: (
			state,
			action: PayloadAction<{ rowId: number; field: string; value: any }>
		) => {
			const index = state.waterInefficiencyRows.findIndex(r => r.id === action.payload.rowId);
			if (index !== -1) {
				state.waterInefficiencyRows[index] = {
					...state.waterInefficiencyRows[index],
					[action.payload.field]: action.payload.value,
				};
			}
		},
		updateSingleUsePpRow: (
			state,
			action: PayloadAction<{ rowId: number; field: string; value: any }>
		) => {
			const index = state.singleUsePpRows.findIndex(r => r.id === action.payload.rowId);
			if (index !== -1) {
				state.singleUsePpRows[index] = {
					...state.singleUsePpRows[index],
					[action.payload.field]: action.payload.value,
				};
			}
		},
		updateClamshellRow: (
			state,
			action: PayloadAction<{ rowId: number; field: string; value: any }>
		) => {
			const index = state.clamshellRows.findIndex(r => r.id === action.payload.rowId);
			if (index !== -1) {
				state.clamshellRows[index] = {
					...state.clamshellRows[index],
					[action.payload.field]: action.payload.value,
				};
			}
		},
		setConstantFields: (
			state,
			action: PayloadAction<{
				electricityConsumed?: string;
				waterConsumed?: string;
				srcingDistance?: string;
				qtyTransportedOneTrip?: string;
			}>
		) => {
			if (action.payload.electricityConsumed !== undefined) {
				state.electricityConsumed = action.payload.electricityConsumed;
			}
			if (action.payload.waterConsumed !== undefined) {
				state.waterConsumed = action.payload.waterConsumed;
			}
			if (action.payload.srcingDistance !== undefined) {
				state.srcingDistance = action.payload.srcingDistance;
			}
			if (action.payload.qtyTransportedOneTrip !== undefined) {
				state.qtyTransportedOneTrip = action.payload.qtyTransportedOneTrip;
			}
		},
		setClientLocked: (state, action: PayloadAction<boolean>) => {
			state.isClientLocked = action.payload;
		},
		clearAllRows: state => {
			state.waterInefficiencyRows = [];
			state.singleUsePpRows = [];
			state.clamshellRows = [];
		},
		setShouldAddDefaultRow: (state, action: PayloadAction<boolean>) => {
			state.shouldAddDefaultRow = action.payload;
		},
		resetSkuMapping: () => {
			return initialState;
		},
	},
});

export const {
	setSelectedClient,
	addWaterInefficiencyRow,
	addSingleUsePpRow,
	addClamshellRow,
	removeWaterInefficiencyRow,
	removeSingleUsePpRow,
	removeClamshellRow,
	updateWaterInefficiencyRow,
	updateSingleUsePpRow,
	updateClamshellRow,
	setConstantFields,
	setClientLocked,
	clearAllRows,
	setShouldAddDefaultRow,
	resetSkuMapping,
} = skuMappingSlice.actions;

export default skuMappingSlice.reducer;
