import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClientLocation } from '../../services/clientApi';

export interface ClientState {
	locations: ClientLocation[];
	selectedLocation: ClientLocation | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: ClientState = {
	locations: [],
	selectedLocation: null,
	isLoading: false,
	error: null,
};

export const clientSlice = createSlice({
	name: 'client',
	initialState,
	reducers: {
		setLocations: (state, action: PayloadAction<ClientLocation[]>) => {
			state.locations = action.payload;
			state.error = null;
		},
		setSelectedLocation: (state, action: PayloadAction<ClientLocation | null>) => {
			state.selectedLocation = action.payload;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		clearClientData: state => {
			state.locations = [];
			state.selectedLocation = null;
			state.error = null;
		},
	},
});

export const { setLocations, setSelectedLocation, setLoading, setError, clearClientData } =
	clientSlice.actions;

export default clientSlice.reducer;
