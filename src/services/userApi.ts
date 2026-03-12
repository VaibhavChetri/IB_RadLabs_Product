/**
 * User Management API Service
 * Handles all CRUD operations for user management in ops admin
 * Based on /api/users endpoints from backend
 */

import { apiService, ApiResponse } from './api';

// ============================================================================
// Types
// ============================================================================

export interface User {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	contact?: string;
	gender?: string;
	userTypeId?: number;
	userTypeName?: string;
	cityId?: number;
	cityName?: string;
	facilityId?: number;
	status?: number | string; // 1 = Active, 0 = Inactive
	createdAt?: string;
	updatedAt?: string;
}

export interface UserFilters {
	page?: number;
	limit?: number;
	name?: string;
	role?: string;
	status?: number | string;
	city_id?: number;
	userTypeId?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
	status_code: number;
	status: string;
	message?: string;
	data: User[];
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface GetUserResponse {
	status_code: number;
	status: string;
	message: string;
	data: User;
}

export interface CreateUserRequest {
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	contact?: string;
	gender?: string;
	userTypeId?: number;
	cityId?: number;
	facilityId?: number;
	status?: number | string;
	userPassword?: string;
}

export interface CreateUserResponse {
	status_code: number;
	status: string;
	message: string;
	data: {
		id: number;
		username: string;
		firstName: string;
		lastName: string;
		email: string;
	};
}

export interface UpdateUserRequest {
	id: number;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	contact?: string;
	gender?: string;
	userTypeId?: number;
	cityId?: number;
	facilityId?: number;
	status?: number | string;
	userPassword?: string;
}

export interface UpdateUserResponse {
	status_code: number;
	status: string;
	message: string;
	data: User;
}

export interface DeleteUserResponse {
	status_code: number;
	status: string;
	message: string;
}

export interface PasswordUpdateRequest {
	userId?: number;
	id?: number;
	oldPassword?: string;
	newPassword: string;
	confirmPassword?: string;
}

// ============================================================================
// API Service
// ============================================================================

export class UserApiService {
	/**
	 * Get list of users with pagination and filters
	 * GET /v1/api/users
	 */
	static async getUsers(filters: UserFilters): Promise<GetUsersResponse> {
		const params = new URLSearchParams();

		if (filters.page) params.append('page', filters.page.toString());
		if (filters.limit) params.append('limit', filters.limit.toString());
		if (filters.name) params.append('name', filters.name);
		if (filters.role) params.append('role', filters.role);
		if (filters.status !== undefined) params.append('status', filters.status.toString());
		if (filters.city_id) params.append('city_id', filters.city_id.toString());
		if (filters.userTypeId) params.append('userTypeId', filters.userTypeId.toString());
		if (filters.sortBy) params.append('sortBy', filters.sortBy);
		if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

		return apiService.get(`/users?${params.toString()}`) as Promise<GetUsersResponse>;
	}

	/**
	 * Get single user by ID
	 * GET /v1/api/users/:userId
	 */
	static async getUser(userId: number | string): Promise<GetUserResponse> {
		return apiService.get(`/users/${userId}`) as Promise<GetUserResponse>;
	}

	/**
	 * Create new user
	 * POST /v1/api/users
	 */
	static async createUser(payload: CreateUserRequest): Promise<CreateUserResponse> {
		return apiService.post('/users', payload) as Promise<CreateUserResponse>;
	}

	/**
	 * Update user
	 * PATCH /v1/api/users/:userId
	 */
	static async updateUser(
		userId: number | string,
		payload: Omit<UpdateUserRequest, 'id'>
	): Promise<UpdateUserResponse> {
		return apiService.patch(`/users/${userId}`, payload) as Promise<UpdateUserResponse>;
	}

	/**
	 * Delete user
	 * DELETE /v1/api/users/:userId
	 */
	static async deleteUser(userId: number | string): Promise<DeleteUserResponse> {
		return apiService.delete(`/users/${userId}`) as Promise<DeleteUserResponse>;
	}

	/**
	 * Update user password
	 * POST /v1/api/users/updatePassword
	 */
	static async updatePassword(payload: PasswordUpdateRequest): Promise<ApiResponse> {
		return apiService.post('/users/updatePassword', payload);
	}
}
