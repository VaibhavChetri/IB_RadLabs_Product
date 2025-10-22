import { ApiService, ApiResponse } from './api';
import { CommonApiService } from './commonApi';

// Re-export interfaces from commonApi for backward compatibility
export type { FacilityOption, ClientByCityOption } from './commonApi';

export interface MasterPlanRow {
	id: number;
	vehicle_id?: number;
	vehicle_number: string | null;
	transit_date: string;
	transit_time: string;
	driver_name: string;
	driver_phone: string;
	created_by: string;
	city_name: string;
	vehicle_type: string;
	restaurant_name: string;
	restaurant_id?: number;
	facility_id?: number;
	type: string; // Dispatch | Pickup | Dispatch & Pickup
	facility: string;
	transit_type_id?: number;
	city_id?: number;
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
	// Use CommonApiService for shared APIs
	getFacilities: CommonApiService.getFacilities,
	getClientsByCity: CommonApiService.getClientsByCity,

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

	async getMasterPlanById(id: number): Promise<ApiResponse<any>> {
		return api.get(`/transit-plan/get-master-plan/${id}`);
	},

	async createMasterPlan(payload: {
		restaurantId: number;
		cityId: number;
		facilityId: number;
		input: Array<{
			transitTypeId: number;
			data: Array<{
				vehicleId: number;
				transitDate: string;
				transitTime: string;
				driverName: string;
				driverPhone: string;
			}>;
		}>;
	}): Promise<ApiResponse<any>> {
		return api.post('/transit-plan/create-master-transit-plan', payload);
	},

	async updateMasterPlan(payload: {
		id: number;
		vehicleId: number;
		driverName: string;
		driverPhone: string;
		restaurantId: number;
		cityId: string;
		transitTypeId: number;
		transitDate: string;
		transitTime: string;
		facilityId: number;
	}): Promise<ApiResponse<any>> {
		return api.put('/transit-plan/edit-master-transit-plan', payload);
	},
};
