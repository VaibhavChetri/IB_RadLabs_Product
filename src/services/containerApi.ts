/**
 * Container API Service
 * Handles all container type-related API operations
 */

import { ApiService } from './api';
import { ApiResponse } from './api';

const api = ApiService.getInstance();

export interface ContainerType {
	id: number;
	sku: string;
	container?: string;
	weight: number;
	weightInGms: number;
	dishwasherCyclesPerDay: number;
	dishwasherOptimumCapacity: number;
	impact_accountable: number;
	city_id?: number;
	name?: string; // City name
	containerCount?: number; // Only when facilityId is provided
	status?: number;
	created_at?: string;
}

export interface GetContainerTypesResponse {
	status_code: number;
	status: string;
	data: ContainerType[];
}

export interface AddContainerTypeRequest {
	container: string;
	weight: number;
	city_id: number;
	dishwasherCyclesPerDay: number;
	dishwasherOptimumCapacity: number;
	weightInGms: number;
	impact_accountable: number;
}

export interface UpdateContainerTypeRequest {
	id: number;
	container: string;
	weight: number;
	city_id: number;
	dishwasherCyclesPerDay: number;
	dishwasherOptimumCapacity: number;
	weightInGms: number;
	impact_accountable: number;
}

export interface DeleteContainerTypeRequest {
	id: number;
	status: number;
}

export interface ContainerTypeResponse {
	status_code: number;
	status: string;
	message: string;
}

export class ContainerApiService {
	/**
	 * Get all container types with optional filters
	 */
	static async getContainerTypes(params?: {
		facilityId?: number;
		all?: boolean;
	}): Promise<ApiResponse<GetContainerTypesResponse>> {
		const queryParams = new URLSearchParams();
		if (params?.facilityId) {
			queryParams.append('facilityId', params.facilityId.toString());
		}
		if (params?.all) {
			queryParams.append('all', 'true');
		}

		const url = `/containers/getContainerTypes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		const response = await api.get(url);

		return {
			status_code: response.status_code,
			status: response.status,
			message: response.message || '',
			data: {
				status_code: response.status_code,
				status: response.status,
				data: (response.data as ContainerType[]) || [],
			},
		};
	}

	/**
	 * Add a new container type
	 */
	static async addContainerType(
		data: AddContainerTypeRequest
	): Promise<ApiResponse<ContainerTypeResponse>> {
		return api.post('/containers/addContainer', data);
	}

	/**
	 * Update an existing container type
	 */
	static async updateContainerType(
		data: UpdateContainerTypeRequest
	): Promise<ApiResponse<ContainerTypeResponse>> {
		return api.post('/containers/editContainer', data);
	}

	/**
	 * Delete a container type (soft delete)
	 */
	static async deleteContainerType(
		data: DeleteContainerTypeRequest
	): Promise<ApiResponse<ContainerTypeResponse>> {
		return api.post('/containers/delContainer', data);
	}
}
