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
	clientId?: number;
	clientName: string;
	dispatchDateTime: string;
	facilityId?: number;
	skus: Array<{
		sku: string;
		count: number;
		containerTypeId?: number;
		id?: number; // Record ID for update
		rawItem?: any; // Full API item for edit page
	}>;
}

// Client by City Response
export interface ClientByCityItem {
	clientId: number;
	clientName: string;
}

export interface ClientByCityResponse {
	status_code: number;
	result?: ClientByCityItem[];
	message?: string;
}

// Dashboard KAM Response (matches DashboardResponse from hooks)
export interface DashboardKAMResponse {
	status_code: number;
	summaryCount?: {
		totalSummary?: {
			totalClientSKUCount?: number;
			totalClientAvgSKUCount?: number;
		};
	};
	total?: {
		totalPlasticSavedKg?: number;
		water?: number;
		ghc?: number;
	};
	segResult?: {
		byDate?: Record<
			string,
			{
				totalCount: number;
				day: string;
			}
		>;
		byWeek?: Array<{
			weekNumber: number;
			days: Array<{
				date: string;
				totalCount: number;
			}>;
		}>;
	};
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
	static async getClientByCity(
		location_id: number,
		all?: boolean
	): Promise<ClientByCityResponse> {
		const url = `/inventory/getClientByCity?location_id=${location_id}${all ? '&all=1' : ''}`;
		return this.api.get(url) as Promise<ClientByCityResponse>;
	}

	/**
	 * Get sent count for KAM dashboard
	 */
	static async getSentCountKAM(
		params: {
			location_id: number;
			client_id: string | number; // "All" or client ID
			start_date: string;
			end_date: string;
		},
		signal?: AbortSignal
	): Promise<DashboardKAMResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('location_id', String(params.location_id));
		searchParams.set('client_id', String(params.client_id));
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);

		return this.api.get(`/inventory/getSentCountKAM?${searchParams.toString()}`, {
			signal,
		}) as Promise<DashboardKAMResponse>;
	}
}
