/**
 * Shift API Service
 * Handles shift reporting related API calls
 */

import { apiService, ApiResponse } from './api';

export interface ShiftResourceInfo {
	shiftResourceId: number;
	shiftResourceName: string;
	resourceStatusId: number;
	resourceStatus: string;
	escalationManagerId: number | null;
	escalationManager: string | null;
}

export interface CheckoutInfo {
	manpowerCount: number | null;
	shiftHours: number | null;
	OTHours: number | null;
	manHours: number | null;
	washedSkuCount: number | null;
	washingEfficiency: number | null;
	totalCount: number;
	weightedCount: number;
}

export interface ContainerInfo {
	container_type_id: number;
	sku: string;
	count: number;
	containerWeight: string;
	weightedCount: string;
}

export interface ShiftDetail {
	shiftId: number;
	city: string;
	facility: string;
	shiftTime: string;
	supervisor: string;
	checkInTime: string | null;
	checkOutTime: string | null;
	shiftDate: string;
	resourcesInfo: ShiftResourceInfo[];
	checkout: CheckoutInfo;
	containersInfo: ContainerInfo[];
}

export interface GetFullShiftDetailsParams {
	city_id: number;
	shift_date: string;
}

// Hora (Time) interfaces
export interface Hora {
	id: number;
	name: string;
}

export interface GetHoraResponse {
	status_code: number;
	status: string;
	message: string;
	result: Hora[];
}

// Shift Status interfaces
export interface ShiftStatus {
	shift_id: number;
	hora_id: number;
	shift_type: string;
	check_in: string | null;
	check_out: string | null;
	status: string;
}

export interface GetShiftStatusByDateResponse {
	status: string;
	status_code: number;
	message: string;
	shifts: ShiftStatus[];
}

// Facility Resource interfaces
export interface FacilityResource {
	id: number;
	name: string;
	city_id: number;
	created_by: number;
	updated_by: number;
	status: string;
	created_by_name: string;
	updated_by_name: string;
	created_at: string;
	updated_at: string;
}

export interface GetFacilityResourcesResponse {
	status: string;
	status_code: number;
	data: FacilityResource[];
}

export interface AddFacilityResourceRequest {
	name: string;
}

export interface AddFacilityResourceResponse {
	status: string;
	status_code: number;
	message: string;
	data?: FacilityResource;
}

export interface UpdateFacilityResourceRequest {
	id: number;
	name: string;
	status: number; // 1 for Active, 0 for Inactive
}

export interface UpdateFacilityResourceResponse {
	status: string;
	status_code: number;
	message: string;
	data?: FacilityResource;
}

// Ops Status interfaces
export interface OpsStatus {
	id: number;
	name: string;
	created_by_name: string;
	updated_by_name: string;
	created_at: string;
	updated_at: string;
}

export interface GetOpsStatusValuesResponse {
	status: string;
	status_code: number;
	data: OpsStatus[];
}

// Escalation Manager interfaces
export interface EscalationManager {
	id: number;
	name: string;
	created_by_name: string;
	updated_by_name: string;
	created_at: string;
	updated_at: string;
}

export interface GetEscalationManagersResponse {
	status: string;
	status_code: number;
	data: EscalationManager[];
}

// Check-in Shift Ops Status interfaces
export interface ResourceInfo {
	shift_resource_id: number;
	resource_status_id: number;
	shift_escalation_manager_id?: number;
}

export interface CheckInShiftOpsStatusRequest {
	hora_id: number;
	shift_date: string;
	resourcesInfo: ResourceInfo[];
}

export interface CheckInShiftOpsStatusResponse {
	status: string;
	status_code: number;
	message: string;
}

// Check-out Shift Ops Status interfaces
export interface CheckOutContainerInfo {
	container_type_id: number;
	count: number;
}

export interface CheckOutShiftOpsStatusRequest {
	hora_id: number;
	shift_date: string;
	shift_id: number;
	manpower_count: number;
	shift_hours: number;
	ot_hours: number;
	containersInfo: CheckOutContainerInfo[];
}

export interface CheckOutShiftOpsStatusResponse {
	status: string;
	status_code: number;
	message: string;
}

export class ShiftApiService {
	/**
	 * Get full shift details for a specific city and date
	 */
	static async getFullShiftDetails(
		params: GetFullShiftDetailsParams
	): Promise<ApiResponse<ShiftDetail[]>> {
		return apiService.get('/shift/getFullShiftDetails', {
			params: {
				city_id: params.city_id,
				shift_date: params.shift_date,
			},
		});
	}

	/**
	 * Get Hora (Time) options
	 */
	static async getHora(): Promise<GetHoraResponse> {
		return apiService.get('/ops/getHora') as unknown as Promise<GetHoraResponse>;
	}

	/**
	 * Get shift status by date and hora
	 */
	static async getShiftStatusByDate(
		shift_date: string,
		hora_id: number
	): Promise<GetShiftStatusByDateResponse> {
		return apiService.get('/shift/getShiftStatusByDate', {
			params: {
				shift_date,
				hora_id,
			},
		}) as unknown as Promise<GetShiftStatusByDateResponse>;
	}

	/**
	 * Get facility resources
	 * @param city_id - Optional city ID to filter resources by city
	 * @param page - Page number for pagination
	 * @param limit - Number of items per page
	 */
	static async getFacilityResources(
		page: number = 1,
		limit: number = 10,
		city_id?: number
	): Promise<GetFacilityResourcesResponse> {
		const params: Record<string, string | number> = {
			page,
			limit,
		};
		
		// Add city_id if provided to filter resources by city
		if (city_id !== undefined) {
			params.city_id = city_id;
		}
		
		return apiService.get('/shift/getFacilityResources', {
			params,
		}) as unknown as Promise<GetFacilityResourcesResponse>;
	}

	/**
	 * Get Ops Status values
	 */
	static async getOpsStatusValues(): Promise<GetOpsStatusValuesResponse> {
		return apiService.get(
			'/shift/getOpsStatusValues'
		) as unknown as Promise<GetOpsStatusValuesResponse>;
	}

	/**
	 * Get Escalation Managers
	 */
	static async getEscalationManagers(): Promise<GetEscalationManagersResponse> {
		return apiService.get(
			'/shift/getEscalationManagers'
		) as unknown as Promise<GetEscalationManagersResponse>;
	}

	/**
	 * Check-in Shift Ops Status
	 */
	static async checkInShiftOpsStatus(
		request: CheckInShiftOpsStatusRequest
	): Promise<CheckInShiftOpsStatusResponse> {
		return apiService.post(
			'/shift/checkInShiftOpsStatus',
			request
		) as unknown as Promise<CheckInShiftOpsStatusResponse>;
	}

	/**
	 * Check-out Shift Ops Status
	 */
	static async checkOutShiftOpsStatus(
		request: CheckOutShiftOpsStatusRequest
	): Promise<CheckOutShiftOpsStatusResponse> {
		return apiService.post(
			'/shift/checkOutShiftOpsStatus',
			request
		) as unknown as Promise<CheckOutShiftOpsStatusResponse>;
	}

	/**
	 * Add facility resource
	 */
	static async addFacilityResource(
		request: AddFacilityResourceRequest
	): Promise<AddFacilityResourceResponse> {
		return apiService.post(
			'/shift/addFacilityResource',
			request
		) as unknown as Promise<AddFacilityResourceResponse>;
	}

	/**
	 * Update facility resource
	 */
	static async updateFacilityResource(
		request: UpdateFacilityResourceRequest
	): Promise<UpdateFacilityResourceResponse> {
		return apiService.put(
			'/shift/updateFacilityResource',
			request
		) as unknown as Promise<UpdateFacilityResourceResponse>;
	}
}
