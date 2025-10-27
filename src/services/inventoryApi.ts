import { ApiService } from './api';

// Washing Facility Interface
export interface WashingFacility {
	id: number;
	location: string;
	city_name: string;
	state_name: string;
	country_name: string;
}

// Sent Inventory Response Interface
export interface SentInventoryResponse {
	status: string;
	status_code: number;
	message: string;
	result: number[];
	total: number[];
	totalCount: number;
	days: Array<{
		date: string;
		day: string;
	}>;
}

// Table Row Interface
export interface SentInventoryRow extends Record<string, unknown> {
	id: string;
	serial: number;
	clientName: string;
	dispatchDateTime: string;
	skus: Array<{
		sku: string;
		count: number;
	}>;
}

// API Response Types
export interface WashingFacilitiesResponse {
	status: string;
	statusCode: number;
	message: string;
	data: WashingFacility[];
	pagination: {
		totalCount: number;
		pageSize: number;
		currentPage: number;
		totalPages: number;
	};
}

export class InventoryApiService {
	private static api = ApiService.getInstance();

	/**
	 * Get washing facilities (location_type=2)
	 */
	static async getWashingFacilities(): Promise<WashingFacilitiesResponse> {
		return this.api.get(
			'/locations/getLocations?location_type=2'
		) as unknown as Promise<WashingFacilitiesResponse>;
	}

	/**
	 * Get sent inventory count
	 */
	static async getSentCount(params: {
		location_id: number;
		start_date: string;
		end_date: string;
		pageNumber: number;
		pageSize: number;
	}): Promise<SentInventoryResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('location_id', String(params.location_id));
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('pageNumber', String(params.pageNumber));
		searchParams.set('pageSize', String(params.pageSize));

		return this.api.get(
			`/inventory/getSentCount?${searchParams.toString()}`
		) as unknown as Promise<SentInventoryResponse>;
	}

	/**
	 * Get received inventory count
	 */
	static async getReceivedCount(params: {
		location_id: number;
		date: string;
		pageNumber: number;
		pageSize: number;
	}): Promise<SentInventoryResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('location_id', String(params.location_id));
		searchParams.set('date', params.date);
		searchParams.set('pageNumber', String(params.pageNumber));
		searchParams.set('pageSize', String(params.pageSize));

		return this.api.get(
			`/inventory/getReceivedCount?${searchParams.toString()}`
		) as unknown as Promise<SentInventoryResponse>;
	}

	/**
	 * Get clients by city
	 */
	static async getClientByCity(location_id: number): Promise<any> {
		return this.api.get(`/inventory/getClientByCity?location_id=${location_id}`);
	}
}
