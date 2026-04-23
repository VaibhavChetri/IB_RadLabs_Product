import { ApiService } from './api';

const api = ApiService.getInstance();

// Complaint Type Interfaces
export interface ComplaintType {
	id: number;
	name: string;
	status: string; // 'Active' or 'Inactive'
	status_name?: string; // Optional, not returned by API
	created_by?: number;
	updated_by?: number;
	created_at?: string;
	updated_at?: string;
}

export interface GetComplaintTypesResponse {
	status_code: number;
	status: string;
	data: ComplaintType[];
	pagination?: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface GetComplaintTypeByIdResponse {
	status_code: number;
	status: string;
	data: ComplaintType;
}

export interface CreateComplaintTypeRequest {
	name: string;
	status?: string; // 'Active' or 'Inactive'
}

export interface CreateComplaintTypeResponse {
	status_code: number;
	status: string;
	message: string;
	data?: {
		id: number;
	};
}

export interface UpdateComplaintTypeRequest {
	id: number;
	name?: string;
	status?: string; // 'Active' or 'Inactive'
}

export interface UpdateComplaintTypeResponse {
	status_code: number;
	status: string;
	message: string;
}

export interface DeleteComplaintTypeResponse {
	status_code: number;
	status: string;
	message: string;
}

// Complaint Type API Service
export class ComplaintTypeService {
	/**
	 * Get all complaint types with optional pagination and status filter
	 */
	static async getComplaintTypes(params?: {
		page?: number;
		limit?: number;
		status?: number;
	}): Promise<GetComplaintTypesResponse> {
		const queryParams = new URLSearchParams();
		if (params?.page) {
			queryParams.append('page', params.page.toString());
		}
		if (params?.limit) {
			queryParams.append('limit', params.limit.toString());
		}
		if (params?.status !== undefined) {
			queryParams.append('status', params.status.toString());
		}

		const url = `/transit-plan/getComplaintTypes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		const response = (await api.get(url)) as any;

		return {
			status_code: response.status_code,
			status: response.status,
			data: response.data || [],
			pagination: response.pagination || {
				page: 1,
				limit: 100,
				totalItems: 0,
				totalPages: 0,
			},
		};
	}

	/**
	 * Get a complaint type by ID
	 */
	static async getComplaintTypeById(id: number): Promise<GetComplaintTypeByIdResponse> {
		const url = `/transit-plan/getComplaintType/${id}`;
		const response = (await api.get(url)) as any;

		return {
			status_code: response.status_code,
			status: response.status,
			data: response.data,
		};
	}

	/**
	 * Create a new complaint type
	 */
	static async createComplaintType(
		data: CreateComplaintTypeRequest
	): Promise<CreateComplaintTypeResponse> {
		return api.post('/transit-plan/createComplaintType', data) as unknown as Promise<CreateComplaintTypeResponse>;
	}

	/**
	 * Update an existing complaint type
	 */
	static async updateComplaintType(
		data: UpdateComplaintTypeRequest
	): Promise<UpdateComplaintTypeResponse> {
		return api.put(`/transit-plan/updateComplaintType/${data.id}`, data) as unknown as Promise<UpdateComplaintTypeResponse>;
	}

	/**
	 * Delete a complaint type (soft delete)
	 */
	static async deleteComplaintType(id: number): Promise<DeleteComplaintTypeResponse> {
		return api.delete(`/transit-plan/deleteComplaintType/${id}`) as unknown as Promise<DeleteComplaintTypeResponse>;
	}
}
