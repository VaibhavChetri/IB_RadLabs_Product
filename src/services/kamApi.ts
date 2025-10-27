import { apiService } from './api';

export interface ClientPlanRow {
	clientId: number;
	clientName: string;
}

export interface ClientInventoryRow {
	id: number;
	clientId: number;
	clientName: string;
	openingStock: number | null;
	dispatch: number | null;
	returned: number | null;
	closing: number | null;
	containerTypeId: number;
	containerType: string;
}

export interface InventoryValueRow {
	id: number;
	clientId: number;
	clientName: string;
	cityId: number;
	cityName: string;
	containerTypeId: number;
	containerType: string;
	openingStock: number | null;
	dispatch: number | null;
	returned: number | null;
	closing: number | null;
	has_entered: string;
	created_at: string;
}

export class KamApiService {
	static async getInventoryClientPlan(params: { startDate: string; page: number; limit: number }) {
		const searchParams = new URLSearchParams();
		searchParams.set('startDate', params.startDate);
		searchParams.set('endDate', params.startDate); // Use same date for both
		searchParams.set('page', String(params.page));
		searchParams.set('limit', String(params.limit));

		return apiService.get(`/billing/getInventoryClientPlan?${searchParams.toString()}`);
	}

	static async getEverydayClientInventory(params: {
		client_id: number;
		start_date: string;
		end_date: string;
	}) {
		const searchParams = new URLSearchParams();
		searchParams.set('client_id', String(params.client_id));
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);

		return apiService.get(`/billing/getEverydayClientInventory?${searchParams.toString()}`);
	}

	static async updateEverydayClientInventory(
		payload: Array<{
			id: number;
			client_id: number;
			container_type_id: number;
			opening_stock: number;
			dispatch: number;
			returned: number;
			closing: number;
		}>
	) {
		const requestBody = { clients: payload };
		console.log('📤 Sending to API:', requestBody);
		console.log('📦 Request body structure:', JSON.stringify(requestBody));
		return apiService.put('/billing/updateEverydayClientInventory', requestBody);
	}

	static async getEverydayClientInventoryValues(params: {
		start_date: string;
		end_date: string;
		client_id?: number;
		page: number;
		limit: number;
	}) {
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('page', String(params.page));
		searchParams.set('limit', String(params.limit));

		if (params.client_id !== undefined) {
			searchParams.set('client_id', String(params.client_id));
		}

		return apiService.get(`/billing/getEverydayClientInventoryValues?${searchParams.toString()}`);
	}
}
