/**
 * Services Index
 * Centralized exports for all API services
 */

// Core API
export { apiService, apiClient, TokenManager } from './api';
export type { ApiResponse, ApiError } from './api';

// Domain-specific services
export { AuthApiService } from './authApi';
export type { LoginCredentials, LoginResponse, UserProfile } from './authApi';

export { DashboardApiService } from './dashboardApi';
export type { DashboardStats, ChartData, RecentActivity } from './dashboardApi';

// Factory services
export { ApiServiceFactory, userService, fileService, analyticsService } from './apiFactory';
