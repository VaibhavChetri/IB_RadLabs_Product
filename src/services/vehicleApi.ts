/**
 * Vehicle API Service
 * Handles all vehicle-related API operations
 */

import { ApiService } from './api';
import { ApiResponse } from './api';

const api = ApiService.getInstance();

export interface Vehicle {
	id: number;
	name: string;
	driver_name: string;
	driver_phone: string;
	driver_number?: string;
	vehicle_number: string | null;
	city_id?: number;
	status: number;
	created_at: string;
}

export interface GetVehiclesResponse {
	status_code: number;
	status: string;
	result: Vehicle[];
	pagination: {
		page: number;
		limit: number;
		totalRecords: number;
		totalPages: number;
	};
}

export interface AddVehicleRequest {
	name: string;
	driver_name: string;
	driver_number?: string;
	driver_phone: string;
	vehicle_number: string;
}

export interface UpdateVehicleRequest {
	id: number;
	name: string;
	driver_name: string;
	driver_phone: string;
	vehicle_number: string;
}

export interface DeleteVehicleRequest {
	id: number;
}

export interface VehicleResponse {
	status_code: number;
	status: string;
	message: string;
	result?: {
		affectedRows: number;
		changedRows: number;
	};
}

export class VehicleApiService {
	/**
	 * Get all vehicles with optional sorting
	 */
	static async getVehicles(params?: {
		sortOrder?: 'ASC' | 'DESC';
		sortBy?: string;
	}): Promise<ApiResponse<GetVehiclesResponse>> {
		const queryParams = new URLSearchParams();
		if (params?.sortOrder) {
			queryParams.append('sortOrder', params.sortOrder);
		}
		if (params?.sortBy) {
			queryParams.append('sortBy', params.sortBy);
		}

		const url = `/vehicle/getVehicles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		const response = await api.get(url);
		// API returns { status_code, status, result, pagination } directly
		// Wrap it in the expected ApiResponse format
		return {
			status_code: response.status_code,
			status: response.status,
			message: response.message || '',
			data: {
				status_code: response.status_code,
				status: response.status,
				result: (response as any).result || [],
				pagination: (response as any).pagination || {
					page: 1,
					limit: 10,
					totalRecords: 0,
					totalPages: 0,
				},
			},
		};
	}

	/**
	 * Add a new vehicle
	 */
	static async addVehicle(data: AddVehicleRequest): Promise<ApiResponse<VehicleResponse>> {
		return api.post('/vehicle/addVehicle', data);
	}

	/**
	 * Update an existing vehicle
	 */
	static async updateVehicle(data: UpdateVehicleRequest): Promise<ApiResponse<VehicleResponse>> {
		return api.put('/vehicle/updateVehicle', data);
	}

	/**
	 * Delete a vehicle (soft delete)
	 */
	static async deleteVehicle(data: DeleteVehicleRequest): Promise<ApiResponse<VehicleResponse>> {
		return api.delete('/vehicle/deleteVehicle', { data });
	}
}

