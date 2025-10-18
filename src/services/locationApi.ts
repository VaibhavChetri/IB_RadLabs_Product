import { apiService } from './api';
import { ApiResponse } from './api';

// Location Types
export interface LocationType {
	id: number;
	name: string;
	slug: string;
	status: number;
}

export interface Country {
	id: number;
	name: string;
	code: string;
	status: number;
}

export interface State {
	id: number;
	name: string;
	country_id: number;
	status: number;
}

export interface City {
	id: number;
	name: string;
	state_id: number;
	status: number;
}

// Impact Types
export interface ImpactType {
	id: number;
	name: string;
	slug: string;
	status: number;
}

// Billing Types
export interface BillingType {
	id: number;
	name: string;
	slug: string;
	status: number;
}

export interface BillingSubType {
	id: number;
	name: string;
	slug: string;
	billing_type_id: number;
	status: number;
}

export class LocationApiService {
	/**
	 * Get all location types
	 */
	static async getLocationTypes(): Promise<ApiResponse<LocationType[]>> {
		return apiService.get('/locations/getLocationType');
	}

	/**
	 * Get all countries
	 */
	static async getCountries(): Promise<ApiResponse<Country[]>> {
		return apiService.get('/locations/getCountries');
	}

	/**
	 * Get all states
	 */
	static async getStates(): Promise<ApiResponse<State[]>> {
		return apiService.get('/locations/getStates');
	}

	/**
	 * Get all cities
	 */
	static async getCities(): Promise<ApiResponse<City[]>> {
		return apiService.get('/locations/getCities');
	}
}

export class ImpactApiService {
	/**
	 * Get impact types with pagination
	 */
	static async getImpactTypes(
		page: number = 1,
		limit: number = 10
	): Promise<
		ApiResponse<{
			data: ImpactType[];
			total: number;
			page: number;
			limit: number;
		}>
	> {
		return apiService.get('/impact/getImpactMenu', {
			params: { page, limit },
		});
	}
}

export class BillingApiService {
	/**
	 * Get billing types with pagination
	 */
	static async getBillingTypes(
		page: number = 1,
		limit: number = 10
	): Promise<
		ApiResponse<{
			data: BillingType[];
			total: number;
			page: number;
			limit: number;
		}>
	> {
		return apiService.get('/billing/getBillingTypes', {
			params: { page, limit },
		});
	}

	/**
	 * Get billing sub types with pagination
	 */
	static async getBillingSubTypes(
		page: number = 1,
		limit: number = 10
	): Promise<
		ApiResponse<{
			data: BillingSubType[];
			total: number;
			page: number;
			limit: number;
		}>
	> {
		return apiService.get('/billing/getBillingSubTypes', {
			params: { page, limit },
		});
	}
}
