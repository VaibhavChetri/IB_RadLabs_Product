/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */

import { apiService, ApiResponse } from './api';

// Types
export interface DashboardStats {
	totalUsers: number;
	activeUsers: number;
	totalRevenue: number;
	monthlyRevenue: number;
	growthRate: number;
	conversionRate: number;
}

export interface ChartData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor?: string;
		borderColor?: string;
		fill?: boolean;
	}[];
}

export interface RecentActivity {
	id: string;
	type: 'user_registration' | 'payment' | 'login' | 'system_event';
	title: string;
	description: string;
	timestamp: string;
	userId?: number;
	metadata?: any;
}

export interface DashboardFilters {
	dateRange: {
		start: string;
		end: string;
	};
	period: 'daily' | 'weekly' | 'monthly' | 'yearly';
	metrics?: string[];
}

// Dashboard API Service
export class DashboardApiService {
	/**
	 * Get dashboard statistics
	 */
	static async getStats(filters?: DashboardFilters): Promise<ApiResponse<DashboardStats>> {
		const params = filters ? { ...filters } : {};
		return apiService.get('/dashboard/stats', { params });
	}

	/**
	 * Get revenue chart data
	 */
	static async getRevenueChart(filters?: DashboardFilters): Promise<ApiResponse<ChartData>> {
		const params = filters ? { ...filters } : {};
		return apiService.get('/dashboard/revenue-chart', { params });
	}

	/**
	 * Get user growth chart data
	 */
	static async getUserGrowthChart(filters?: DashboardFilters): Promise<ApiResponse<ChartData>> {
		const params = filters ? { ...filters } : {};
		return apiService.get('/dashboard/user-growth-chart', { params });
	}

	/**
	 * Get conversion funnel data
	 */
	static async getConversionFunnel(filters?: DashboardFilters): Promise<ApiResponse<ChartData>> {
		const params = filters ? { ...filters } : {};
		return apiService.get('/dashboard/conversion-funnel', { params });
	}

	/**
	 * Get recent activities
	 */
	static async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
		return apiService.get('/dashboard/recent-activities', {
			params: { limit },
		});
	}

	/**
	 * Get top performing metrics
	 */
	static async getTopMetrics(filters?: DashboardFilters): Promise<ApiResponse<any[]>> {
		const params = filters ? { ...filters } : {};
		return apiService.get('/dashboard/top-metrics', { params });
	}

	/**
	 * Get geographic data
	 */
	static async getGeographicData(filters?: DashboardFilters): Promise<ApiResponse<any[]>> {
		const params = filters ? { ...filters } : {};
		return apiService.get('/dashboard/geographic-data', { params });
	}

	/**
	 * Export dashboard data
	 */
	static async exportData(
		format: 'csv' | 'xlsx' | 'pdf',
		filters?: DashboardFilters
	): Promise<Blob> {
		const params = filters ? { ...filters, format } : { format };
		const response = await apiService.get('/dashboard/export', {
			params,
			responseType: 'blob',
		});
		return response.data;
	}

	/**
	 * Get real-time metrics
	 */
	static async getRealTimeMetrics(): Promise<ApiResponse<any>> {
		return apiService.get('/dashboard/real-time');
	}

	/**
	 * Subscribe to real-time updates
	 */
	static subscribeToUpdates(callback: (data: any) => void): () => void {
		// This would typically use WebSocket or Server-Sent Events
		// For now, we'll use polling as a fallback
		const interval = setInterval(async () => {
			try {
				const response = await this.getRealTimeMetrics();
				callback(response.data);
			} catch (error) {
				console.error('Failed to fetch real-time metrics:', error);
			}
		}, 30000); // Poll every 30 seconds

		return () => clearInterval(interval);
	}
}
