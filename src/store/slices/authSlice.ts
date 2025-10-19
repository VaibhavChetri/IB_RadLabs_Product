import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuPermission } from '../../types/menu';

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: string;
	userTypeId?: number; // NEW: User type ID
	city_id?: number; // NEW: User's city ID
	menuPermissions?: Record<string, MenuPermission>; // NEW: Menu permissions
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean; // NEW: Track if auth has been checked on app load
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false, // NEW: Start as not initialized
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginStart: state => {
			state.isLoading = true;
		},
		loginSuccess: (state, action: PayloadAction<User>) => {
			state.user = action.payload;
			state.isAuthenticated = true;
			state.isLoading = false;
		},
		loginFailure: state => {
			state.user = null;
			state.isAuthenticated = false;
			state.isLoading = false;
		},
		logout: state => {
			state.user = null;
			state.isAuthenticated = false;
			state.isLoading = false;
		},
		updateUser: (state, action: PayloadAction<Partial<User>>) => {
			if (state.user) {
				state.user = { ...state.user, ...action.payload };
			}
		},
		restoreAuth: (state, action: PayloadAction<User>) => {
			state.user = action.payload;
			state.isAuthenticated = true;
			state.isLoading = false;
			state.isInitialized = true; // NEW: Mark as initialized
		},
		initializeAuth: state => {
			state.isInitialized = true; // NEW: Mark as initialized even if no auth found
		},
	},
});

export const {
	loginStart,
	loginSuccess,
	loginFailure,
	logout,
	updateUser,
	restoreAuth,
	initializeAuth,
} = authSlice.actions;
