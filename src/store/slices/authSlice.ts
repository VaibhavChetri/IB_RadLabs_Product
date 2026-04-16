import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuPermission } from '../../types/menu';

export interface User {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	role: string;
	userTypeId?: number; // NEW: User type ID
	userTypeName?: string; // NEW: User type name
	city_id?: number; // NEW: User's city ID
	city_name?: string; // NEW: User's city name
	state_id?: number; // NEW: User's state ID
	state_name?: string; // NEW: User's state name
	menuPermissions?: Record<string, MenuPermission>; // NEW: Menu permissions
	isApprover?: boolean; // Whether this admin is a configured vendor invoice approver
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isInitialized: boolean; // NEW: Track if auth has been checked on app load
	editMasterPlanData?: any; // NEW: Store edit data for master plan
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false, // NEW: Start as not initialized
	editMasterPlanData: null, // NEW: Initialize edit data
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
