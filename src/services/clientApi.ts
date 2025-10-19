import { apiService } from './api';
import { ApiResponse } from './api';

// Client/Location interfaces based on API response
export interface ClientLocation {
	id: number;
	location: string;
	city_id: number;
	restaurant_id: number;
	restaurant_name: string;
	city_name: string;
	state_id: number;
	state_name: string;
	country_id: number;
	country_name: string;
	address_1: string;
	address_2: string;
	landmark: string;
	zipcode: string;
	latitude: string;
	longitude: string;
	billing_type_id: number;
	billingType: string;
	billing_sub_type_id: number | null;
	subTypeName: string | null;
	locationTypeId: number;
	location_type_name: string;
	operationalDays: number;
	impactTypes: unknown[];
	fixedPriceId: number | null;
	fixedPrice: number | null;
	hasOnSiteManPower: boolean | null;
	status: string;
	facilityId: number | null;
	facilityName: string | null;
	floors: Floor[];
	clientSkuMap: ClientSkuMap[];
}

export interface Floor {
	floor_id: number;
	floor_name: string;
	sections: unknown[];
}

export interface ClientSkuMap {
	id: number;
	location_id: number;
	container_type_id: number;
	created_at: string;
	updated_at: string;
	created_by: number;
	updated_by: number;
	status: number;
	location_name: string;
	container_name: string;
}

export interface ClientLocationFilters {
	page?: number;
	limit?: number;
	city_id?: number;
	location_type?: number;
	client_id?: number;
}

export interface ClientLocationResponse {
	data: ClientLocation[];
	pagination: {
		totalCount: number;
		pageSize: number;
		currentPage: number;
		totalPages: number;
	};
}

export interface Client {
	id: number;
	name?: string;
	restaurant_name?: string;
}

export interface AddClientRequest {
	location: string;
	address_1: string;
	address_2: string;
	landmark: string;
	zipcode: string;
	latitude: string;
	longitude: string;
	city_id: number;
	state_id: number;
	country_id: number;
	location_type: number;
	billing_type_id: number;
	billing_sub_type_id?: number;
	impact_type_ids: number[];
	onSiteManPower: number;
	facility_id?: number;
	fixed_price?: string;
}

export interface UpdateClientRequest {
	location_id: number;
	restaurant_id: number;
	country_id: number;
	state_id: number;
	city_id: number;
	latitude: string;
	longitude: string;
	landmark: string;
	zipcode: string;
	location: string;
	address_1: string;
	address_2: string;
	location_type: number;
	impact_type_ids: number[];
	billing_type_id: number;
	billing_sub_type_id?: number;
	onSiteManPower: number;
	facility_id?: number;
	fixed_price?: string;
	fixed_pricing_id?: number;
}

export class ClientApiService {
	/**
	 * Get client locations with filters
	 */
	static async getClientLocations(
		filters: ClientLocationFilters = {}
	): Promise<ApiResponse<ClientLocationResponse>> {
		const params = new URLSearchParams();

		// Add default values
		params.append('page', (filters.page || 1).toString());
		params.append('limit', (filters.limit || 1000).toString());

		// Add optional filters
		if (filters.city_id) params.append('city_id', filters.city_id.toString());
		if (filters.location_type) params.append('location_type', filters.location_type.toString());
		if (filters.client_id) params.append('client_id', filters.client_id.toString());

		return apiService.get(`/locations/getLocations?${params.toString()}`);
	}

	/**
	 * Add client location
	 */
	static async addClient(data: AddClientRequest): Promise<ApiResponse<unknown>> {
		return apiService.post('/restaurants/addClient', data);
	}

	/**
	 * Update client location
	 */
	static async updateClient(data: UpdateClientRequest): Promise<ApiResponse<unknown>> {
		return apiService.put('/restaurants/updateClient', data);
	}

	/**
	 * Update client status
	 */
	static async updateClientStatus(id: number, status: number): Promise<ApiResponse<unknown>> {
		return apiService.put('/restaurants/updateClientStatus', { id, status });
	}
}
