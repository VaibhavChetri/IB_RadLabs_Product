import { ApiService, ApiResponse } from './api';

export interface FacilityOption {
	id: number;
	location: string;
}

export interface ClientByCityOption {
	clientId: number;
	clientName: string;
}

export interface MasterPlanRow {
	id: number;
	vehicle_number: string | null;
	transit_date: string;
	transit_time: string;
	driver_name: string;
	driver_phone: string;
	created_by: string;
	city_name: string;
	vehicle_type: string;
	restaurant_name: string;
	type: string; // Dispatch | Pickup | Dispatch & Pickup
	facility: string;
}

export interface MasterPlanListingResponse {
	rows: MasterPlanRow[];
	pagination: {
		page: string | number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

const api = ApiService.getInstance();

export const TransitPlanApi = {
	async getFacilities(cityId: number): Promise<ApiResponse<FacilityOption[]>> {
		return api.get(`/locations/getLocations?location_type=2&city_id=${cityId}&limit=1000`);
	},

	async getClientsByCity(cityId: number): Promise<ApiResponse<ClientByCityOption[]>> {
		// Note: this endpoint returns { status_code, result: [] } directly
		const response = await api.get(`/inventory/getClientByCity`);
		// Transform the response to match our expected format
		return {
			status_code: response.status_code,
			status: response.status,
			message: response.message,
			data: response.result || [],
		};
	},

	async getMasterPlanListing(params: {
		pageNumber: number;
		pageSize: number;
		sortOrder: 'asc' | 'desc';
		facilityId?: number;
		restaurantId?: number;
		transitTypeId?: number;
	}): Promise<ApiResponse<MasterPlanListingResponse>> {
		const searchParams = new URLSearchParams();
		searchParams.set('pageNumber', String(params.pageNumber));
		searchParams.set('pageSize', String(params.pageSize));
		searchParams.set('sortOrder', params.sortOrder);
		if (params.facilityId) searchParams.set('facilityId', String(params.facilityId));
		if (params.restaurantId) searchParams.set('restaurantId', String(params.restaurantId));
		if (params.transitTypeId) searchParams.set('transitTypeId', String(params.transitTypeId));
		return api.get(`/plan/getMasterPlanListing?${searchParams.toString()}`);
	},
};
