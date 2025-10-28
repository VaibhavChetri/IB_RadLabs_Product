import { ApiService } from './api';

// API Response Interfaces
export interface ApiResponse<T> {
	status: string;
	status_code: number;
	message?: string;
	result: T;
}

// Impact Type Interface
export interface ImpactType {
	id: number;
	name: string;
}

// Client with Impact Types
export interface ClientWithImpactTypes {
	clientName: string;
	clientId: number;
	impactTypes: ImpactType[];
}

// Client SKU Mapping Response
export interface ClientSkuMapping {
	clientName: string;
	price: string;
	clientId: number;
	containerType: string;
	containerTypeId: number;
	status: string;
	platesWashedPerCycleByClient?: number;
	distanceFromWarehouse?: number;
	srcingDistance?: number | null;
	weight_bagasse?: string | null;
	srcQtyTransportedOneTripEv?: number | null;
	qtyTransportedOneTrip?: number | null;
	numberOfClamshell?: number | null;
	electricityConsumedPerCycle: string;
	waterConsumedPerCycle: number;
	disposableWeight?: number | null;
	combine_sku: number;
	impactId: number;
	impactName: string;
}

// Container Payload for Add/Update
export interface ContainerPayload {
	container_type_id: number;
	price: number;
	platesWashedPerCycleByClient?: number;
	distanceFromWarehouse?: number;
	srcingDistance?: number | null;
	weight_bagasse?: number | null;
	srcQtyTransportedOneTripEv?: number | null;
	qtyTransportedOneTrip?: number | null;
	numberOfClamshell?: number | null;
	electricityConsumedPerCycle: number;
	disposableWeight?: number | null;
	waterConsumedPerCycle: number;
	combineSku: number;
	impact_type_id: number;
}

// Client Payload for Add/Update
export interface ClientPayload {
	id: number;
	containers: ContainerPayload[];
}

// Add Client SKU Map Request
export interface AddClientSkuMapRequest {
	user_id: number;
	clients: ClientPayload[];
}

// Update Client SKU Map Request (uses same structure as update API)
export interface UpdateClientSkuMapRequest {
	containers: Array<{
		client_id: number;
		status: number;
		containerDetails: ContainerPayload[];
	}>;
}

/**
 * SKU API Service for managing client SKU mappings
 */
export class SkuApiService {
	private static api = ApiService.getInstance();

	/**
	 * Get clients by location ID
	 * Reuses existing method from InventoryApiService
	 */
	static async getClientByCity(location_id: number): Promise<any> {
		return this.api.get(`/inventory/getClientByCity?location_id=${location_id}`);
	}

	/**
	 * Get client SKU mappings
	 */
	static async getClientSkuMap(clientId: number): Promise<any> {
		return this.api.get(`/inventory/getClientSkuMap?clientId=${clientId}`);
	}

	/**
	 * Add new client SKU mappings
	 */
	static async addClientSkuMap(payload: AddClientSkuMapRequest): Promise<any> {
		return this.api.post('/inventory/addClientSkuMap', payload);
	}

	/**
	 * Update existing client SKU mappings
	 */
	static async updateClientSkuMap(payload: UpdateClientSkuMapRequest): Promise<any> {
		return this.api.put('/inventory/updateClientSkuMap', payload);
	}

	/**
	 * Get all B2B container types
	 */
	static async getContainerTypes(): Promise<any> {
		return this.api.get('/containers/getB2BContainersTypes');
	}
}
