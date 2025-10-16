import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DashboardStats {
  totalUsers: number
  totalRevenue: number
  totalOrders: number
  conversionRate: number
}

export interface DashboardState {
  stats: DashboardStats
  isLoading: boolean
  lastUpdated: string | null
}

const initialState: DashboardState = {
  stats: {
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    conversionRate: 0,
  },
  isLoading: false,
  lastUpdated: null,
}

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchStatsStart: (state) => {
      state.isLoading = true
    },
    fetchStatsSuccess: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload
      state.isLoading = false
      state.lastUpdated = new Date().toISOString()
    },
    fetchStatsFailure: (state) => {
      state.isLoading = false
    },
    updateStats: (state, action: PayloadAction<Partial<DashboardStats>>) => {
      state.stats = { ...state.stats, ...action.payload }
      state.lastUpdated = new Date().toISOString()
    },
  },
})

export const { fetchStatsStart, fetchStatsSuccess, fetchStatsFailure, updateStats } = dashboardSlice.actions

