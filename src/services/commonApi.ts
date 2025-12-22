import { ApiService } from './api';
import { ApiResponse } from './api';

// Common interfaces for dropdowns
export interface FacilityOption {
	id: number;
	location: string; // Match the actual API response
}

export interface ClientByCityOption {
	clientId: number; // Match the actual API response
	clientName: string;
}

export interface LocationTypeOption {
	id: number;
	name: string;
	slug?: string;
	status?: number;
}

export interface CityOption {
	id: number;
	name: string;
	state_id?: number;
	status?: number;
}

export interface VehicleOption {
	id: number;
	name: string; // vehicle name
	driver_name: string;
	driver_phone?: string;
}

export interface TransitTypeOption {
	id: number;
	name: string;
}

const api = ApiService.getInstance();

/**
 * Common API service for shared dropdown and common data endpoints
 * Used across multiple modules to avoid duplication
 */
export class CommonApiService {
	/**
	 * Get facilities (locations with type=2) for dropdowns
	 */
	static async getFacilities(cityId?: number): Promise<ApiResponse<FacilityOption[]>> {
		const url = cityId
			? `/locations/getLocations?location_type=2&city_id=${cityId}&limit=1000`
			: `/locations/getLocations?location_type=2&limit=1000`;
		return api.get(url);
	}

	/**
	 * Get clients (locations with type=3) for dropdowns
	 */
	static async getClients(): Promise<ApiResponse<any[]>> {
		return api.get('/locations/getLocations?location_type=3&limit=1000');
	}

	/**
	 * Get all clients for dropdowns (no city filter)
	 */
	static async getClientsByCity(): Promise<ApiResponse<ClientByCityOption[]>> {
		try {
			const response = await api.get(`/transit-plan/get-citywise-restaurants`);
			// Transform the response to match our expected format
			return {
				status_code: response.status_code,
				status: response.status,
				message: response.message,
				data: ((response.data as any)?.result || response.data || []).map((c: any) => ({
					clientId: c.id,
					clientName: c.name,
				})),
			};
		} catch (error) {
			console.error('Error fetching clients:', error);
			// Fallback to empty array if API fails
			return {
				status_code: 200,
				status: 'success',
				message: 'Fallback data',
				data: [],
			};
		}
	}

	/**
	 * Get all location types for dropdowns
	 */
	static async getLocationTypes(): Promise<ApiResponse<LocationTypeOption[]>> {
		return api.get('/locations/getLocationType');
	}

	/**
	 * Get all cities for dropdowns
	 */
	static async getCities(): Promise<ApiResponse<CityOption[]>> {
		return api.get('/locations/getCities');
	}

	/**
	 * Get all countries for dropdowns
	 */
	static async getCountries(): Promise<ApiResponse<any[]>> {
		return api.get('/locations/getCountries');
	}

	/**
	 * Get all states for dropdowns
	 */
	static async getStates(): Promise<ApiResponse<any[]>> {
		return api.get('/locations/getStates');
	}

	/**
	 * Get all vehicles for dropdowns
	 */
	static async getVehicles(): Promise<ApiResponse<VehicleOption[]>> {
		const response = (await api.get('/vehicle/getVehicles')) as any;
		// Transform the response to match our expected format
		// API returns { status_code, status, result: [...], pagination: {...} }
		return {
			status_code: response.status_code,
			status: response.status,
			message: response.message || '',
			data: response.result || response.data || [], // Use result array or data as fallback
		};
	}

	/**
	 * Get transit types from API
	 */
	static async getTransitTypes(): Promise<ApiResponse<TransitTypeOption[]>> {
		try {
			const response = await api.get('/transit-plan/get-transit-types');
			return {
				status_code: response.status_code,
				status: response.status,
				message: response.message,
				data: ((response.data as any)?.result || response.data || []).map((t: any) => ({
					id: t.id,
					name: t.type, // API returns 'type' field, not 'name'
				})),
			};
		} catch {
			// Fallback to hardcoded values if API is not available yet
			console.warn('Transit types API not available, using fallback values');
			return {
				status_code: 200,
				status: 'Success',
				message: 'Using fallback transit types',
				data: [
					{ id: 1, name: 'Dispatch' },
					{ id: 2, name: 'Pickup' },
					{ id: 3, name: 'Dispatch & Pickup' },
				],
			};
		}
	}
}
