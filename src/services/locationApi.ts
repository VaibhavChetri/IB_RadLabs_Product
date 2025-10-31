import { apiService, ApiResponse } from './api';
import { CommonApiService } from './commonApi';

// Re-export common interfaces for backward compatibility
export type { LocationTypeOption as LocationType, CityOption as City } from './commonApi';

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
	// Use CommonApiService for shared APIs
	static getLocationTypes = CommonApiService.getLocationTypes;
	static getCountries = CommonApiService.getCountries;
	static getStates = CommonApiService.getStates;
	static getCities = CommonApiService.getCities;
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
