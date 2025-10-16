/**
 * API State Management
 * Redux slice for handling API loading states and errors
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface ApiState {
	loading: boolean;
	error: string | null;
	lastFetch: number | null;
}

export interface ApiCallState {
	[key: string]: ApiState;
}

// Initial state
const initialState: ApiCallState = {};

// Generic async thunk creator
export const createApiAsyncThunk = <TArgs, TReturn>(
	prefix: string,
	apiCall: (args: TArgs) => Promise<TReturn>
) => {
	return createAsyncThunk(`${prefix}/apiCall`, async (args: TArgs, { rejectWithValue }) => {
		try {
			const result = await apiCall(args);
			return result;
		} catch (error: any) {
			return rejectWithValue(error.message || 'An error occurred');
		}
	});
};

// API slice
const apiSlice = createSlice({
	name: 'api',
	initialState,
	reducers: {
		clearError: (state, action: PayloadAction<string>) => {
			const key = action.payload;
			if (state[key]) {
				state[key].error = null;
			}
		},
		clearAllErrors: state => {
			Object.keys(state).forEach(key => {
				state[key].error = null;
			});
		},
		resetApiState: (state, action: PayloadAction<string>) => {
			const key = action.payload;
			if (state[key]) {
				state[key] = {
					loading: false,
					error: null,
					lastFetch: null,
				};
			}
		},
	},
	extraReducers: builder => {
		// Generic handlers for any async thunk
		builder
			.addMatcher(
				action => action.type.endsWith('/pending'),
				(state, action) => {
					const key = action.type.replace('/pending', '');
					state[key] = {
						loading: true,
						error: null,
						lastFetch: state[key]?.lastFetch || null,
					};
				}
			)
			.addMatcher(
				action => action.type.endsWith('/fulfilled'),
				(state, action) => {
					const key = action.type.replace('/fulfilled', '');
					state[key] = {
						loading: false,
						error: null,
						lastFetch: Date.now(),
					};
				}
			)
			.addMatcher(
				action => action.type.endsWith('/rejected'),
				(state, action) => {
					const key = action.type.replace('/rejected', '');
					state[key] = {
						loading: false,
						error: (action as any).payload as string,
						lastFetch: state[key]?.lastFetch || null,
					};
				}
			);
	},
});

// Selectors
export const selectApiLoading = (state: { api: ApiCallState }, key: string) =>
	state.api[key]?.loading || false;

export const selectApiError = (state: { api: ApiCallState }, key: string) =>
	state.api[key]?.error || null;

export const selectApiLastFetch = (state: { api: ApiCallState }, key: string) =>
	state.api[key]?.lastFetch || null;

export const selectApiState = (state: { api: ApiCallState }, key: string) =>
	state.api[key] || { loading: false, error: null, lastFetch: null };

// Actions
export const { clearError, clearAllErrors, resetApiState } = apiSlice.actions;

// Reducer
export default apiSlice.reducer;
