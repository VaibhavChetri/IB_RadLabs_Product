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
		return response.result || [];
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
	}): Promise<{
		status: string;
		status_code: number;
		message: string;
		dc_number: string;
	}> {
		const response = await api.post('/inventory/sendB2BInventory', payload);
		console.log('🔍 sendB2BInventory response:', response);
		return response;
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
		};
		pickupImages: null;
		containerTypes: unknown[];
	}): Promise<{
		status: string;
		status_code: number;
		message: string;
		data: unknown[];
	}> {
		const response = await api.post('/transit-plan/initiate-transit-plan', payload);
		console.log('🔍 initiateTransitPlan response:', response);
		return response;
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
		const response = await api.post('/inventory/receivedB2BInventory', payload);
		console.log('🔍 receivedB2BInventory response:', response);
		return response;
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
	status: string;
}

export interface GetEscalationTypesResponse {
	status: string;
	status_code: number;
	data: EscalationType[];
}

export interface CreateEscalationTypeRequest {
	name: string;
}

export interface CreateEscalationTypeResponse {
	status: string;
	status_code: number;
	data: {
		id: number;
		name: string;
	};
}

export interface UpdateEscalationTypeRequest {
	name: string;
	status?: number;
}

export interface UpdateEscalationTypeResponse {
	status: string;
	status_code: number;
	data: {
		id: string;
		name: string;
	};
}

// Escalation Type API Service
export class EscalationTypeService {
	/**
	 * Get all escalation types (complaint types)
	 */
	static async getEscalationTypes(): Promise<GetEscalationTypesResponse> {
		return api.get(
			'/transit-plan/getComplaintTypes'
		) as unknown as Promise<GetEscalationTypesResponse>;
	}

	/**
	 * Create a new escalation type
	 */
	static async createEscalationType(
		data: CreateEscalationTypeRequest
	): Promise<CreateEscalationTypeResponse> {
		return api.post(
			'/transit-plan/createComplaintType',
			data
		) as unknown as Promise<CreateEscalationTypeResponse>;
	}

	/**
	 * Update an existing escalation type
	 */
	static async updateEscalationType(
		id: number,
		data: UpdateEscalationTypeRequest
	): Promise<UpdateEscalationTypeResponse> {
		return api.put(
			`/transit-plan/updateComplaintType/${id}`,
			data
		) as unknown as Promise<UpdateEscalationTypeResponse>;
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
