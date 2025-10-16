/**
 * Generic API Service Factory
 * Creates typed API services for different domains
 */

import { apiService, ApiResponse } from './api';

// Generic API Service Factory
export class ApiServiceFactory {
	private static readonly BASE_PATH = '';

	/**
	 * Create a generic CRUD service for a resource
	 */
	static createCrudService<T, CreateT = Omit<T, 'id'>, UpdateT = Partial<T>>(resourceName: string) {
		const basePath = `${this.BASE_PATH}/${resourceName}`;

		return {
			/**
			 * Get all items with optional filters
			 */
			getAll: (params?: any): Promise<ApiResponse<T[]>> => {
				return apiService.get(basePath, { params });
			},

			/**
			 * Get item by ID
			 */
			getById: (id: string | number): Promise<ApiResponse<T>> => {
				return apiService.get(`${basePath}/${id}`);
			},

			/**
			 * Create new item
			 */
			create: (data: CreateT): Promise<ApiResponse<T>> => {
				return apiService.post(basePath, data);
			},

			/**
			 * Update item by ID
			 */
			update: (id: string | number, data: UpdateT): Promise<ApiResponse<T>> => {
				return apiService.put(`${basePath}/${id}`, data);
			},

			/**
			 * Partially update item by ID
			 */
			patch: (id: string | number, data: UpdateT): Promise<ApiResponse<T>> => {
				return apiService.patch(`${basePath}/${id}`, data);
			},

			/**
			 * Delete item by ID
			 */
			delete: (id: string | number): Promise<ApiResponse<void>> => {
				return apiService.delete(`${basePath}/${id}`);
			},

			/**
			 * Bulk operations
			 */
			bulkCreate: (data: CreateT[]): Promise<ApiResponse<T[]>> => {
				return apiService.post(`${basePath}/bulk`, data);
			},

			bulkUpdate: (data: { id: string | number; data: UpdateT }[]): Promise<ApiResponse<T[]>> => {
				return apiService.put(`${basePath}/bulk`, data);
			},

			bulkDelete: (ids: (string | number)[]): Promise<ApiResponse<void>> => {
				return apiService.delete(`${basePath}/bulk`, { data: { ids } });
			},

			/**
			 * Search items
			 */
			search: (query: string, filters?: any): Promise<ApiResponse<T[]>> => {
				return apiService.get(`${basePath}/search`, {
					params: { q: query, ...filters },
				});
			},

			/**
			 * Get paginated results
			 */
			getPaginated: (
				page: number = 1,
				limit: number = 10,
				filters?: any
			): Promise<
				ApiResponse<{
					data: T[];
					pagination: {
						page: number;
						limit: number;
						total: number;
						totalPages: number;
						hasNext: boolean;
						hasPrev: boolean;
					};
				}>
			> => {
				return apiService.get(basePath, {
					params: { page, limit, ...filters },
				});
			},
		};
	}

	/**
	 * Create a service for file operations
	 */
	static createFileService() {
		const basePath = `${this.BASE_PATH}/files`;

		return {
			/**
			 * Upload file
			 */
			upload: (
				file: File,
				onProgress?: (progress: number) => void
			): Promise<
				ApiResponse<{
					id: string;
					url: string;
					filename: string;
					size: number;
					mimeType: string;
				}>
			> => {
				const formData = new FormData();
				formData.append('file', file);

				return apiService.uploadWithProgress(
					`${basePath}/upload`,
					formData,
					onProgress
						? progressEvent => {
								const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
								onProgress(progress);
							}
						: undefined
				);
			},

			/**
			 * Get file by ID
			 */
			getById: (
				id: string
			): Promise<
				ApiResponse<{
					id: string;
					url: string;
					filename: string;
					size: number;
					mimeType: string;
					createdAt: string;
				}>
			> => {
				return apiService.get(`${basePath}/${id}`);
			},

			/**
			 * Delete file
			 */
			delete: (id: string): Promise<ApiResponse<void>> => {
				return apiService.delete(`${basePath}/${id}`);
			},

			/**
			 * Get file URL for download
			 */
			getDownloadUrl: (id: string): string => {
				return `${import.meta.env.VITE_API_BASE_URL}${basePath}/${id}/download`;
			},
		};
	}

	/**
	 * Create a service for analytics
	 */
	static createAnalyticsService() {
		const basePath = `${this.BASE_PATH}/analytics`;

		return {
			/**
			 * Track event
			 */
			track: (event: string, properties?: any): Promise<ApiResponse<void>> => {
				return apiService.post(`${basePath}/track`, {
					event,
					properties,
					timestamp: new Date().toISOString(),
				});
			},

			/**
			 * Get analytics data
			 */
			getData: (filters?: any): Promise<ApiResponse<any>> => {
				return apiService.get(basePath, { params: filters });
			},

			/**
			 * Get user analytics
			 */
			getUserAnalytics: (userId: string | number): Promise<ApiResponse<any>> => {
				return apiService.get(`${basePath}/user/${userId}`);
			},
		};
	}
}

// Export commonly used services
export const userService = ApiServiceFactory.createCrudService('users');
export const fileService = ApiServiceFactory.createFileService();
export const analyticsService = ApiServiceFactory.createAnalyticsService();
