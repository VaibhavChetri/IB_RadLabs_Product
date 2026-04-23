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

export interface TransitPlanRow extends Record<string, unknown> {
	id: number;
	transit_date: string;
	transit_time?: string; // API might use different field name
	time?: string; // Alternative field name
	restaurant_name?: string; // API might use restaurant_name instead of restaurant
	restaurant?: string;
	type: string;
	driver_name?: string; // API might use driver_name instead of driver
	driver?: string;
	status?: string;
	transit_status?: number; // Numeric status (0, 1, 2, etc.)
	transit_status_label?: string; // Human readable status ("New", "In Progress", etc.)
	facility_name?: string; // API might use facility_name instead of facility
	facility?: string;
	vehicle_type: string;
	driver_phone: string;
	vehicle_number?: string | null; // Can be null
	vehicle_no?: string; // Alternative field name for vehicle number
	plate_number?: string; // Another alternative
	initiated_date?: string;
	total_qty?: number;
	signature?: string;
	delay?: string;
	// Additional fields that might be in the API response
	created_at?: string;
	updated_at?: string;
	restaurant_id?: number;
	facility_id?: number;
	driver_id?: number;
	vehicle_id?: number;
	// Fields from actual API response
	creation_date?: string;
	creation_at?: string;
	initiated_at?: string;
	city_name?: string;
	created_by?: string;
	initiated_by?: string;
	clientId?: number;
	dc?: string | null;
	dispatch_images?: string | null;
	pickup_images?: string | null;
	delivery_images?: string | null;
	delay_of?: string | null;
	signature_name?: string | null;
	email?: string | null;
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

export interface TransitPlanListingResponse {
	rows: TransitPlanRow[];
}

export interface TransitPlanPagination {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
}

export interface TransitPlanListingApiResponse {
	status_code: number;
	status: string;
	data: TransitPlanListingResponse;
	pagination: TransitPlanPagination;
}

// Sent Transit Plan Interfaces
export interface RestaurantOption {
	clientId: number;
	clientName: string;
}

export interface SentTransitPlanRow extends Record<string, unknown> {
	id: number;
	transit_id: string;
	transitDate: string;
	updated_at: string;
	transit_time: string;
	clientLocationName: string;
	transit_type_id: number;
	transitType: string;
	driver_name: string;
	driver_phone: string;
	facilityName: string;
	restaurantName: string;
	restaurantId: number;
	facilityId: number;
	clientLocationId: number;
	transit_status: number;
	dc: string | null;
	transit_status_label: string;
}

export interface SentTransitPlanApiResponse {
	status_code: number;
	status: string;
	result: SentTransitPlanRow[];
	pagination: {
		page: string;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

// Client SKU Map Interfaces
export interface ClientSkuMapItem {
	clientName: string;
	price: string;
	clientId: number;
	containerType: string;
	containerTypeId: number;
	status: string;
	platesWashedPerCycleByClient: number;
	distanceFromWarehouse: number;
	srcingDistance: number;
	weight_bagasse: string;
	srcQtyTransportedOneTripEv: number;
	qtyTransportedOneTrip: number;
	numberOfClamshell: number;
	electricityConsumedPerCycle: string;
	waterConsumedPerCycle: number;
	disposableWeight: number;
	combine_sku: number;
	impactId: number;
	impactName: string;
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

	async getTransitPlanListing(params: {
		start_date: string;
		end_date: string;
		page: number;
		limit: number;
		sortField: string;
		sortOrder: 'asc' | 'desc';
		transit_status?: number;
		restaurant_id?: number;
	}): Promise<TransitPlanListingApiResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('page', String(params.page));
		searchParams.set('limit', String(params.limit));
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('sortField', params.sortField);
		searchParams.set('sortOrder', params.sortOrder);

		if (params.transit_status !== undefined) {
			searchParams.set('transit_status', String(params.transit_status));
		}
		if (params.restaurant_id !== undefined) {
			searchParams.set('restaurant_id', String(params.restaurant_id));
		}

		return api.get(
			`/transit-plan/get-transit-plan-listing?${searchParams.toString()}`
		) as unknown as Promise<TransitPlanListingApiResponse>;
	},

	async getMasterPlanById(id: number): Promise<ApiResponse<MasterPlanRow>> {
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
	}): Promise<ApiResponse<{ id: number; message: string }>> {
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
	}): Promise<ApiResponse<{ id: number; message: string }>> {
		return api.put('/transit-plan/edit-master-transit-plan', payload);
	},

	// Sent Transit Plan APIs
	async getRestaurants(
		cityId: number
	): Promise<{ status: string; status_code: number; result: RestaurantOption[] }> {
		return api.get(`/restaurants/getRestaurants?cityId=${cityId}`) as unknown as Promise<{
			status: string;
			status_code: number;
			result: RestaurantOption[];
		}>;
	},

	async getCurrentPlanDetails(params: {
		start_date: string;
		end_date: string;
		location_id?: string;
		facility_id?: number;
		transit_type_id?: number;
		page: number;
		limit: number;
	}): Promise<SentTransitPlanApiResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('page', String(params.page));
		searchParams.set('limit', String(params.limit));

		if (params.location_id !== undefined) {
			searchParams.set('location_id', params.location_id);
		}
		if (params.facility_id !== undefined) {
			searchParams.set('facility_id', String(params.facility_id));
		}
		if (params.transit_type_id !== undefined) {
			searchParams.set('transit_type_id', String(params.transit_type_id));
		}

		return api.get(
			`/transit-plan/getCurrentPlanDetails?${searchParams.toString()}`
		) as unknown as Promise<SentTransitPlanApiResponse>;
	},

	async getClientSkuMap(clientId: number, facilityId: number): Promise<ClientSkuMapItem[]> {
		const response = await api.get(
			`/inventory/getClientSkuMap?clientId=${clientId}&facilityId=${facilityId}`
		);
		console.log('🔍 getClientSkuMap - Raw API response:', response);
		// api.get() returns response.data from axios, so response is already the API response object
		// The result array is in response.result
		const result = (response as any)?.result || (response as any)?.data || [];
		console.log('🔍 getClientSkuMap - Extracted result:', result);
		// Ensure containerType field is set for each item
		return (Array.isArray(result) ? result : []).map((item: any) => ({
			...item,
			containerType: item.containerType || item.container_type || item.containerTypeName || '',
		})) as ClientSkuMapItem[];
	},

	async uploadImage(file: File): Promise<unknown> {
		const formData = new FormData();
		formData.append('file', file);

		const response = await api.post('/image/uploadImage', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});

		return response;
	},

	async sendB2BInventory(payload: {
		containers: Array<{ container_type_id: number; count: number }>;
		facility_id: number;
		transit_date: string;
		client_location_id: number;
		transit_id: string;
		adhoc: number;
		driver_name?: string;
		driver_phone?: string;
		vehicle_number?: string;
	}): Promise<{
		status: string;
		status_code: number;
		message: string;
		dc_number: string;
	}> {
		const response = (await api.post('/inventory/sendB2BInventory', payload)) as ApiResponse<{
			dc_number: string;
		}>;
		console.log('🔍 sendB2BInventory response:', response);
		return {
			status: response.status,
			status_code: response.status_code,
			message: response.message || '',
			dc_number: (response.data as any)?.dc_number || '',
		};
	},

	async initiateTransitPlan(payload: {
		transitId: number;
		vehicleNumber: string;
		signatureName: string;
		dispatchConditionIds: string;
		dispatchImages: {
			challanPic: unknown[];
			signaturePic: string;
			loadedVehiclePic: Array<{ path: string }>;
		} | null;
		pickupImages: {
			challanPic: unknown[];
			signaturePic: string;
			loadedVehiclePic: Array<{ path: string }>;
		} | null;
		containerTypes: unknown[];
	}): Promise<{
		status: string;
		status_code: number;
		message: string;
		data: unknown[];
	}> {
		const response = (await api.post(
			'/transit-plan/initiate-transit-plan',
			payload
		)) as ApiResponse<unknown[]>;
		console.log('🔍 initiateTransitPlan response:', response);
		return {
			status: response.status,
			status_code: response.status_code,
			message: response.message || '',
			data: Array.isArray(response.data) ? response.data : [],
		};
	},

	async updateB2BInventory(payload: {
		containers: Array<{
			id: number | null;
			client_id: number;
			container_type_id: number;
			count: number;
			facility_id: number;
		}>;
	}): Promise<{
		status: string;
		status_code: number;
		message: string;
		data?: unknown;
	}> {
		const response = (await api.put(
			'/inventory/updateB2BInventory',
			payload
		)) as ApiResponse<unknown>;
		console.log('🔍 updateB2BInventory response:', response);
		return {
			status: response.status,
			status_code: response.status_code,
			message: response.message || '',
			data: response.data,
		};
	},

	async getSentCount(params: {
		location_id: number;
		client_id: number;
		start_date: string;
		end_date: string;
		transit_time: string;
		transit_type_id: number;
	}): Promise<unknown> {
		// Manually construct query string to avoid URL encoding issues with time format
		const queryString = `location_id=${params.location_id}&client_id=${params.client_id}&start_date=${params.start_date}&end_date=${params.end_date}&transit_time=${params.transit_time}&transit_type_id=${params.transit_type_id}`;

		const response = await api.get(`/inventory/getSentCount?${queryString}`);
		console.log('🔍 getSentCount response:', response);
		return response;
	},

	// Received Transit Plan APIs
	async getReceivedPlanDetails(params: {
		start_date: string;
		end_date: string;
		location_id?: string;
		facility_id?: number;
		transit_type_id?: number;
		page: number;
		limit: number;
	}): Promise<SentTransitPlanApiResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('page', String(params.page));
		searchParams.set('limit', String(params.limit));

		if (params.location_id !== undefined) {
			searchParams.set('location_id', params.location_id);
		}
		if (params.facility_id !== undefined) {
			searchParams.set('facility_id', String(params.facility_id));
		}
		if (params.transit_type_id !== undefined) {
			searchParams.set('transit_type_id', String(params.transit_type_id));
		}

		return api.get(
			`/transit-plan/getCurrentPlanDetails?${searchParams.toString()}`
		) as unknown as Promise<SentTransitPlanApiResponse>;
	},

	async receivedB2BInventory(payload: {
		containers: Array<{ container_type_id: number; count: number }>;
		facility_id: number;
		transit_date: string;
		client_location_id: number;
		transit_id: string;
		adhoc: number;
	}): Promise<{
		status: string;
		status_code: number;
		message: string;
		dc_number: string;
	}> {
		const response = (await api.post('/inventory/receivedB2BInventory', payload)) as ApiResponse<{
			dc_number: string;
		}>;
		console.log('🔍 receivedB2BInventory response:', response);
		return {
			status: response.status,
			status_code: response.status_code,
			message: response.message || '',
			dc_number: (response.data as any)?.dc_number || '',
		};
	},

	async getReceivedCount(params: {
		location_id: number;
		client_id: number;
		start_date: string;
		end_date: string;
		transit_time: string;
		transit_type_id: number;
	}): Promise<unknown> {
		// Manually construct query string to avoid URL encoding issues with time format
		const queryString = `location_id=${params.location_id}&client_id=${params.client_id}&start_date=${params.start_date}&end_date=${params.end_date}&transit_time=${params.transit_time}&transit_type_id=${params.transit_type_id}`;

		const response = await api.get(`/inventory/getSentCount?${queryString}`);
		console.log('🔍 getReceivedCount response:', response);
		return response;
	},
};

// Escalation Type (Complaint Type) Interfaces
export interface EscalationType {
	id: number;
	name: string;
	status: number;
	status_name: string;
	created_by?: number;
	updated_by?: number;
	created_at: string;
	updated_at: string;
}

export interface GetEscalationTypesResponse {
	status_code: number;
	status: string;
	data: EscalationType[];
	pagination?: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface CreateEscalationTypeRequest {
	name: string;
	status?: number;
}

export interface CreateEscalationTypeResponse {
	status_code: number;
	status: string;
	message: string;
}

export interface UpdateEscalationTypeRequest {
	id: number;
	name?: string;
	status?: number;
}

export interface UpdateEscalationTypeResponse {
	status_code: number;
	status: string;
	message: string;
}

export interface DeleteEscalationTypeRequest {
	id: number;
}

export interface DeleteEscalationTypeResponse {
	status_code: number;
	status: string;
	message: string;
}

// Escalation Type API Service
export class EscalationTypeService {
	/**
	 * Get all escalation types with optional pagination and status filter
	 */
	static async getEscalationTypes(params?: {
		page?: number;
		limit?: number;
		status?: number;
	}): Promise<GetEscalationTypesResponse> {
		const queryParams = new URLSearchParams();
		if (params?.page) {
			queryParams.append('page', params.page.toString());
		}
		if (params?.limit) {
			queryParams.append('limit', params.limit.toString());
		}
		if (params?.status !== undefined) {
			queryParams.append('status', params.status.toString());
		}

		const url = `/ops/getEscalationType${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		const response = (await api.get(url)) as any;

		// API returns { status_code, status, data, pagination } directly
		return {
			status_code: response.status_code,
			status: response.status,
			data: response.data || [],
			pagination: response.pagination || {
				page: 1,
				limit: 100,
				totalItems: 0,
				totalPages: 0,
			},
		};
	}

	/**
	 * Create a new escalation type
	 */
	static async createEscalationType(
		data: CreateEscalationTypeRequest
	): Promise<CreateEscalationTypeResponse> {
		return api.post(
			'/ops/addEscalationType',
			data
		) as unknown as Promise<CreateEscalationTypeResponse>;
	}

	/**
	 * Update an existing escalation type
	 */
	static async updateEscalationType(
		data: UpdateEscalationTypeRequest
	): Promise<UpdateEscalationTypeResponse> {
		return api.put(
			'/ops/updateEscalationType',
			data
		) as unknown as Promise<UpdateEscalationTypeResponse>;
	}

	/**
	 * Delete an escalation type (soft delete)
	 */
	static async deleteEscalationType(
		data: DeleteEscalationTypeRequest
	): Promise<DeleteEscalationTypeResponse> {
		return api.delete('/ops/deleteEscalationType', {
			data,
		}) as unknown as Promise<DeleteEscalationTypeResponse>;
	}
}

// Client Escalation Interfaces
export interface ClientEscalation {
	id: number;
	escalation_date: string;
	client_id: number;
	client_name: string;
	containerTypeId?: number;
	containerType?: string;
	escalation_type_id: number;
	escalation_type: string;
	resolution: string | null;
	resolution_status: string;
	resolutionStatusId: number;
	details: string;
	raised_by: string;
	client_designation: string;
	facility_id: number;
	facility: string;
	created_by_name?: string;
	updated_by_name?: string;
	created_date?: string;
	updated_date?: string;
	sku?: number;
}

export interface GetClientEscalationsResponse {
	status_code: number;
	status: string;
	data: ClientEscalation[];
	totalEscalationWeekWise?: Record<string, any>;
	totalEscalationClientWiseByWeek?: Record<string, any>;
	totalEscalations?: number;
	statusCount?: Record<string, any>;
	pagination?: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface AddClientEscalationRequest {
	facility_id: number;
	sku: number;
	escalation_date: string;
	client_id: number;
	details: string;
	raised_by: string;
	client_designation: string;
	escalation_type_id: number;
}

export interface AddClientEscalationResponse {
	status_code: number;
	status: string;
	message: string;
}

export interface UpdateClientEscalationRequest {
	id: number;
	escalation_date?: string;
	client_id?: number;
	sku?: number;
	escalation_type_id?: number;
	details?: string;
	raised_by?: string;
	client_designation?: string;
	resolution?: string;
	resolution_status_id?: number;
	facility_id?: number;
}

export interface UpdateClientEscalationResponse {
	status_code: number;
	status: string;
	message: string;
}

// Client Escalation API Service
export class ClientEscalationService {
	/**
	 * Get client escalations with filters
	 */
	static async getClientEscalations(params?: {
		startDate?: string;
		endDate?: string;
		facility_id?: number;
		page?: number;
		limit?: number;
	}): Promise<GetClientEscalationsResponse> {
		const queryParams = new URLSearchParams();
		if (params?.startDate) {
			queryParams.append('startDate', params.startDate);
		}
		if (params?.endDate) {
			queryParams.append('endDate', params.endDate);
		}
		if (params?.facility_id) {
			queryParams.append('facility_id', params.facility_id.toString());
		}
		if (params?.page) {
			queryParams.append('page', params.page.toString());
		}
		if (params?.limit) {
			queryParams.append('limit', params.limit.toString());
		}

		const url = `/ops/getEscalation${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
		const response = (await api.get(url)) as unknown as {
			status_code: number;
			status: string;
			data?: ClientEscalation[];
			totalEscalationWeekWise?: Record<string, unknown>;
			totalEscalationClientWiseByWeek?: Record<string, unknown>;
			totalEscalations?: number;
			statusCount?: Record<string, unknown>;
			pagination?: {
				page: number;
				limit: number;
				totalItems: number;
				totalPages: number;
			};
		};

		return {
			status_code: response.status_code,
			status: response.status,
			data: response.data || [],
			totalEscalationWeekWise: response.totalEscalationWeekWise,
			totalEscalationClientWiseByWeek: response.totalEscalationClientWiseByWeek,
			totalEscalations: response.totalEscalations,
			statusCount: response.statusCount,
			pagination: response.pagination || {
				page: 1,
				limit: 10,
				totalItems: 0,
				totalPages: 0,
			},
		};
	}

	/**
	 * Create a new client escalation
	 */
	static async addClientEscalation(
		data: AddClientEscalationRequest
	): Promise<AddClientEscalationResponse> {
		return api.post(
			'/ops/addClientEscalation',
			data
		) as unknown as Promise<AddClientEscalationResponse>;
	}

	/**
	 * Update an existing client escalation
	 */
	static async updateClientEscalation(
		data: UpdateClientEscalationRequest
	): Promise<UpdateClientEscalationResponse> {
		return api.put(
			'/ops/editClientEscalation',
			data
		) as unknown as Promise<UpdateClientEscalationResponse>;
	}
}

// QC Rejection Interfaces
export interface QCRejection {
	id: number;
	runId: number;
	transitId: string;
	transitDate: string;
	transitTime: string;
	containerTypeId: number;
	containerTypeName: string;
	reasonId: number;
	reasonName: string;
	rejectedCount: number;
	createdBy: number;
	createdByName: string;
	updatedBy: number;
	updatedByName: string;
	createdAt: string;
	updatedAt: string;
	hasEntered: string;
	clientId: number;
	clientName: string;
	[key: string]: unknown;
}

export interface GetQCRejectionsResponse {
	status: string;
	status_code: number;
	data: QCRejection[];
}

// QC Run Interfaces (for Add page)
export interface QCRun {
	id: number;
	transit_id: string;
	transit_date: string;
	transit_time: string;
	client_id: number;
	clientName: string;
	city_id: number;
	cityName: string;
	hasEntered: string;
}

export interface GetQCRunsResponse {
	status: string;
	status_code: number;
	data: QCRun[];
}

// QC Report Adherence Interfaces
export interface QCDailyAdherence {
	date: string;
	submitted: number;
	total: number;
	adherence: number;
}

export interface QCTotalAdherence {
	submitted: number;
	total: number;
	adherence: number;
}

export interface GetQCReportAdherenceResponse {
	status: string;
	status_code: number;
	data: {
		cityId: number;
		startDate: string;
		endDate: string;
		daily: QCDailyAdherence[];
		total: QCTotalAdherence;
	};
}

// QC Rejection API Service
export class QCRejectionService {
	/**
	 * Get QC rejections
	 */
	static async getQCRejections(params: {
		transit_date: string;
		client_id?: number;
	}): Promise<GetQCRejectionsResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('transit_date', params.transit_date);
		if (params.client_id) {
			searchParams.set('client_id', params.client_id.toString());
		}
		return api.get(
			`/transit-plan/getQCRejections?${searchParams.toString()}`
		) as unknown as Promise<GetQCRejectionsResponse>;
	}

	/**
	 * Get QC runs (for Add page)
	 */
	static async getQCRuns(params: {
		transit_date: string;
		client_id?: number;
	}): Promise<GetQCRunsResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('transit_date', params.transit_date);
		if (params.client_id) {
			searchParams.set('client_id', params.client_id.toString());
		}
		return api.get(
			`/transit-plan/getQcRuns?${searchParams.toString()}`
		) as unknown as Promise<GetQCRunsResponse>;
	}

	/**
	 * Get QC report adherence stats
	 */
	static async getQCReportAdherence(params: {
		start_date: string;
		end_date: string;
	}): Promise<GetQCReportAdherenceResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		return api.get(
			`/transit-plan/getQcReportAdherence?${searchParams.toString()}`
		) as unknown as Promise<GetQCReportAdherenceResponse>;
	}

	/**
	 * Submit QC rejections
	 */
	static async submitQCRejections(
		runId: number,
		payload: {
			details: Array<{
				containerTypeId: number;
				reasonId: number;
				rejectedCount: number;
			}>;
		}
	): Promise<{ status: string; status_code: number; message?: string }> {
		return api.post(`/transit-plan/qcRejections/${runId}`, payload) as unknown as Promise<{
			status: string;
			status_code: number;
			message?: string;
		}>;
	}
}
