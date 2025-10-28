import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClientSkuMapping } from '../../services/skuApi';

interface SkuListingState {
	clients: any[];
	selectedClientId: number | null;
	selectedStatus: string;
	mappings: ClientSkuMapping[];
	loading: boolean;
}

const initialState: SkuListingState = {
	clients: [],
	selectedClientId: null,
	selectedStatus: '',
	mappings: [],
	loading: false,
};

const skuListingSlice = createSlice({
	name: 'skuListing',
	initialState,
	reducers: {
		setClients: (state, action: PayloadAction<any[]>) => {
			state.clients = action.payload;
		},
		setSelectedClientId: (state, action: PayloadAction<number | null>) => {
			state.selectedClientId = action.payload;
		},
		setSelectedStatus: (state, action: PayloadAction<string>) => {
			state.selectedStatus = action.payload;
		},
		setMappings: (state, action: PayloadAction<ClientSkuMapping[]>) => {
			state.mappings = action.payload;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		clearMappings: state => {
			state.mappings = [];
		},
	},
});

export const {
	setClients,
	setSelectedClientId,
	setSelectedStatus,
	setMappings,
	setLoading,
	clearMappings,
} = skuListingSlice.actions;
export default skuListingSlice.reducer;
