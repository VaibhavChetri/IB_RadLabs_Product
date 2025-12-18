/**
 * P&L API Service
 * Handles Profit & Loss related API calls
 */

import { apiService } from './api';

// Cost Category Interfaces
export interface CostCategory {
	id: number;
	costCategories: string;
	status: string;
}

export interface GetCostCategoriesResponse {
	status_code: number;
	status: string;
	data: CostCategory[];
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

// Request Interfaces
export interface GetRevenueParams {
	city_id?: number;
	facility_id: number;
	start_date: string;
	end_date: string;
	reviewCategoryTypeId?: number;
	page?: number;
	limit?: number;
	allResults?: boolean;
}

export interface GetRevenueInUnitsParams {
	city_id: number;
	facility_id: number;
	start_date: string;
	end_date: string;
	page: number;
	limit: number;
}

export interface GetEBITDAParams {
	city_id: number;
	facility_id: number;
	start_date: string;
	end_date: string;
	groupByClient: boolean;
}

export interface GetClientWisePLParams {
	city_id: number;
	facility_id: number;
	start_date: string;
	end_date: string;
	groupByClient: boolean;
}

export interface GetEscalationParams {
	cityId: number;
	facilityId: number;
	startDate: string;
	endDate: string;
}

// Response Interfaces
export interface RevenueRecord {
	id: number;
	costingTypeName: string;
	costingTypeId: number;
	reviewCategoryTypeId: number;
	projected_value: string;
	week1_actual_value: string;
	week1_delta_with_percentage: string;
	week2_actual_value: string;
	week2_delta_with_percentage: string;
	week3_actual_value: string;
	week3_delta_with_percentage: string;
	week4_actual_value: string;
	week4_delta_with_percentage: string;
	total_actual_value: string;
	total_delta_with_percentage: string;
	date_year: string;
	created_at: string;
	cityId: number;
	cityName: string;
	facilityName: string;
	facilityId: number;
	billing_type_id: number;
}

export interface CostingType {
	costingTypeId: number;
	costingTypeName: string;
}

export interface WeekData {
	week1: boolean;
	week2: boolean;
	week3: boolean;
	week4: boolean;
}

export interface MonthYearData {
	monthYear: string;
	weekData: WeekData;
	records: RevenueRecord[];
	costingTypes: CostingType[];
	onSiteManPowerDetails?: OnSiteManPowerItem[];
}

export interface FacilityData {
	facilityId: number;
	facilityName: string;
	monthYearData: MonthYearData[];
}

export interface CityData {
	cityId: number;
	cityName: string;
	facilities: FacilityData[];
}

export interface RevenueResponse {
	status_code: number;
	status: string;
	data: CityData[];
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface UnitEconomicsItem {
	costingTypeId: number;
	costingTypeName: string;
	facilityId: number;
	week1OpdCount: string;
	week2OpdCount: string;
	week3OpdCount: string;
	week4OpdCount: string;
	grossCosts: number;
	estGrossCost: string;
	projectValue: string;
	week1_actual_value: number;
	week1Delta: string;
	week2_actual_value: number;
	week2Delta: string;
	week3_actual_value: number;
	week3Delta: string;
	week4_actual_value: number;
	week4Delta: string;
	aggrUnit: number;
}

export interface UnitEconomicsTotal {
	projectedUnitValueTotal: string;
	week1UnitTotal: string;
	week2UnitTotal: string;
	week3UnitTotal: string;
	week4UnitTotal: string;
	week1DeltaTotal: string;
	week2DeltaTotal: string;
	week3DeltaTotal: string;
	week4DeltaTotal: string;
	aggrUnitTotal: string;
}

export interface WeekBreakdown {
	name: string;
	startDate: string;
	endDate: string;
}

export interface RevenueInUnitsResponse {
	status: string;
	status_code: number;
	message: string;
	updateUnitEconomics: UnitEconomicsItem[];
	total: UnitEconomicsTotal;
	weeksBreakdown: WeekBreakdown[];
}

export interface WeekTotals {
	week1: number;
	week2: number;
	week3: number;
	week4: number;
	total: number;
	projected?: string | number;
	totalProjectedValue?: number;
}

export interface VariableCostDetail extends RevenueRecord {
	projectedValue: string;
}

export interface IndirectExpenseDetail extends RevenueRecord {
	projectedValue: string;
}

export interface MonthReport {
	totalRevenue: WeekTotals;
	totalVariableCost: WeekTotals;
	totalContribution: WeekTotals;
	totalIndirectExpenseCost: WeekTotals;
	EBITDA: WeekTotals;
	variableCostDetails: VariableCostDetail[];
	indirectExpenseDetails: IndirectExpenseDetail[];
}

export interface EBITDAResponse {
	status_code: number;
	status: string;
	report: Record<string, MonthReport>; // Key is month name like "October"
}

export interface ClientWisePLClient {
	skuCount: string;
	opdCount: string;
	price: number | string;
	revPerPlate: number | null;
	clientName: string;
	clientId: number;
	billing_type_id: number;
	billing_sub_type_id: number | null;
	Manpower: number;
	Electricity: number;
	Water: number;
	Consumables: number;
	Chemicals: number;
	'Rental Genset': number;
	Diesel: number;
	'Pest control': number;
	'Rent of Plates and Crockery': number;
	Logistics: number;
	Salaries: number;
	'Rent Of Washing Facility': number;
	'Printing & Stationary': number;
	'Repairs & Maintenance': number;
	'Misc expenses': number;
	'Due and Subcription': number;
	'Staff Welfare': number;
	'Fuel and Travelling': number;
	'Plant & Machinery taken on Rent': number;
	'Monthly Revenue Est': number;
	'On Site Manpower': number;
	contribution: number;
	marginPercentage: number | null;
}

export interface ClientWisePLTotals {
	totalPrice: number;
	totalOpdCount: number;
	revenuePerPlate: number;
	contribution: number;
	marginPercentage: number;
	manpower: number;
	electricity: number;
	water: number;
	consumables: number;
	chemicals: number;
	rentalGenset: number;
	diesel: number;
	pestControl: number;
	rentOfPlatesAndCrockery: number;
	logistics: number;
	salaries: number;
	rentOfWashingFacility: number;
	printingStationary: number;
	repairsMaintenance: number;
	miscExpenses: number;
	dueAndSubcription: number;
	staffWelfare: number;
	fuelAndTravelling: number;
	plantMachineryTakenOnRent: number;
	monthlyRevenueEst: number;
	onSiteManpower: number;
	data: ClientWisePLClient[];
}

export interface ClientWisePLResponse {
	status_code: number;
	status: string;
	clientWiseData: ClientWisePLTotals;
	revenueCostHeadsDetail: RevenueRecord[];
}

export interface EscalationWeekTotal {
	delta: number;
}

export interface EscalationResponse {
	status_code: number;
	status: string;
	data: unknown[]; // Escalation items (empty in sample, structure TBD)
	totalEscalationWeekWise: {
		week1: EscalationWeekTotal;
		week2: EscalationWeekTotal;
		week3: EscalationWeekTotal;
		week4: EscalationWeekTotal;
	};
	totalEscalationClientWiseByWeek: {
		week1: Record<string, unknown>;
		week2: Record<string, unknown>;
		week3: Record<string, unknown>;
		week4: Record<string, unknown>;
	};
	totalEscalations: number;
	statusCount: Record<string, unknown>;
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

export class PAndLApiService {
	/**
	 * Get Revenue data
	 * GET /api/review/getRevenue
	 */
	static async getRevenue(params: GetRevenueParams): Promise<RevenueResponse> {
		const searchParams = new URLSearchParams();
		if (params.city_id) {
			searchParams.set('city_id', params.city_id.toString());
		}
		searchParams.set('facility_id', params.facility_id.toString());
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		if (params.reviewCategoryTypeId) {
			searchParams.set('reviewCategoryTypeId', params.reviewCategoryTypeId.toString());
		}
		if (params.page !== undefined) {
			searchParams.set('page', params.page.toString());
		}
		if (params.limit !== undefined) {
			searchParams.set('limit', params.limit.toString());
		}
		if (params.allResults) {
			searchParams.set('allResults', 'true');
		}

		const response = await apiService.get<RevenueResponse>(
			`/review/getRevenue?${searchParams.toString()}`
		);
		// apiService.get already returns response.data from axios
		// So response is already the RevenueResponse structure { status_code, status, data, ... }
		return response as unknown as RevenueResponse;
	}

	/**
	 * Get Revenue in Units
	 * GET /api/review/getRevenueInUnits
	 */
	static async getRevenueInUnits(params: GetRevenueInUnitsParams): Promise<RevenueInUnitsResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_id', params.city_id.toString());
		searchParams.set('facility_id', params.facility_id.toString());
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('page', params.page.toString());
		searchParams.set('limit', params.limit.toString());

		const response = await apiService.get<RevenueInUnitsResponse>(
			`/review/getRevenueInUnits?${searchParams.toString()}`
		);
		// apiService.get already returns response.data from axios
		// So response is already the RevenueInUnitsResponse structure { status_code, status, updateUnitEconomics, ... }
		return response as unknown as RevenueInUnitsResponse;
	}

	/**
	 * Update Revenue
	 * PUT /api/review/updateRevenue
	 */
	static async updateRevenue(data: UpdateRevenueRequest): Promise<UpdateRevenueResponse> {
		console.log('PAndLApiService.updateRevenue - Calling endpoint:', '/review/updateRevenue');
		console.log('PAndLApiService.updateRevenue - Payload:', JSON.stringify(data, null, 2));
		try {
			const response = await apiService.put<UpdateRevenueResponse>('/review/updateRevenue', data);
			console.log('PAndLApiService.updateRevenue - Response:', response);
			// apiService.put already returns response.data from axios
			return response as unknown as UpdateRevenueResponse;
		} catch (error: unknown) {
			const axiosError = error as {
				response?: { status?: number; data?: unknown };
				message?: string;
			};
			console.error('PAndLApiService.updateRevenue - Error:', error);
			console.error('PAndLApiService.updateRevenue - Error response:', axiosError?.response);
			console.error('PAndLApiService.updateRevenue - Error status:', axiosError?.response?.status);
			console.error('PAndLApiService.updateRevenue - Error data:', axiosError?.response?.data);
			console.error(
				'PAndLApiService.updateRevenue - Full URL would be:',
				`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3099/v1/api'}/review/updateRevenue`
			);
			throw error;
		}
	}

	/**
	 * Get EBITDA data
	 * GET /api/review/getEBITDA
	 */
	static async getEBITDA(params: GetEBITDAParams): Promise<EBITDAResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_id', params.city_id.toString());
		searchParams.set('facility_id', params.facility_id.toString());
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('groupByClient', params.groupByClient.toString());

		const response = await apiService.get<EBITDAResponse>(
			`/review/getEBITDA?${searchParams.toString()}`
		);
		// apiService.get already returns response.data from axios
		// So response is already the EBITDAResponse structure { status_code, status, report }
		return response as unknown as EBITDAResponse;
	}

	/**
	 * Get Client Wise P&L data
	 * GET /api/review/getClientWisePL
	 */
	static async getClientWisePL(params: GetClientWisePLParams): Promise<ClientWisePLResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_id', params.city_id.toString());
		searchParams.set('facility_id', params.facility_id.toString());
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('groupByClient', params.groupByClient.toString());

		const response = await apiService.get<ClientWisePLResponse>(
			`/review/getClientWisePL?${searchParams.toString()}`
		);
		// apiService.get already returns response.data from axios
		// So response is already the ClientWisePLResponse structure { status_code, status, clientWiseData }
		return response as unknown as ClientWisePLResponse;
	}

	/**
	 * Get Escalations data
	 * GET /api/ops/getEscalation
	 */
	static async getEscalation(params: GetEscalationParams): Promise<EscalationResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('cityId', params.cityId.toString());
		searchParams.set('facilityId', params.facilityId.toString());
		searchParams.set('startDate', params.startDate);
		searchParams.set('endDate', params.endDate);

		const response = await apiService.get<EscalationResponse>(
			`/ops/getEscalation?${searchParams.toString()}`
		);
		// apiService.get already returns response.data from axios
		// So response is already the EscalationResponse structure { status_code, status, data, totalEscalationWeekWise, ... }
		return response as unknown as EscalationResponse;
	}

	/**
	 * Get Cost Categories
	 */
	static async getCostCategories(status: number | string = 1): Promise<GetCostCategoriesResponse> {
		const statusParam = typeof status === 'string' ? status : status.toString();
		const response = await apiService.get<GetCostCategoriesResponse>(
			`/review/getCostCategories?status=${statusParam}`
		);
		// apiService.get already returns response.data from axios
		return response as unknown as GetCostCategoriesResponse;
	}
}

// Review Costing Type Interfaces
export interface ReviewCostingType {
	id: number;
	name: string;
	reviewCategoryName: string;
	status: string;
}

export interface GetReviewCostingTypeResponse {
	status_code: number;
	status: string;
	data: ReviewCostingType[];
	pagination?: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

// Extended PAndLApiService with Review Costing Type method
export class ReviewCostingTypeService {
	/**
	 * Get Review Costing Types
	 */
	static async getReviewCostingType(
		page: number = 1,
		limit: number = 22,
		showAll: boolean = false,
		reviewCategoryTypeId?: number,
		status?: number
	): Promise<GetReviewCostingTypeResponse> {
		const params = new URLSearchParams();
		params.set('page', page.toString());
		params.set('limit', limit.toString());
		params.set('showAll', showAll.toString());
		if (reviewCategoryTypeId !== undefined) {
			params.set('reviewCategoryTypeId', reviewCategoryTypeId.toString());
		}
		if (status !== undefined) {
			params.set('status', status.toString());
		}
		const response = await apiService.get<GetReviewCostingTypeResponse>(
			`/review/getReviewCostingType?${params.toString()}`
		);
		// apiService.get already returns response.data from axios
		return response as unknown as GetReviewCostingTypeResponse;
	}

	/**
	 * Add Review Costing Type
	 * POST /api/review/addReviewCostingType
	 */
	static async addReviewCostingType(data: {
		name: string;
		reviewCategoryTypeId: number;
	}): Promise<{ status_code: number; status: string; message?: string }> {
		const response = await apiService.post<{
			status_code: number;
			status: string;
			message?: string;
		}>('/review/addReviewCostingType', data);
		return response as unknown as { status_code: number; status: string; message?: string };
	}

	/**
	 * Update Review Costing Type
	 * PUT /api/review/updateReviewCostingType
	 */
	static async updateReviewCostingType(data: {
		id: number;
		name: string;
		reviewCategoryTypeId: number;
		status: number;
	}): Promise<{ status_code: number; status: string; message?: string }> {
		const response = await apiService.put<{
			status_code: number;
			status: string;
			message?: string;
		}>('/review/updateReviewCostingType', data);
		return response as unknown as { status_code: number; status: string; message?: string };
	}
}

// Review Category Type Interfaces
export interface ReviewCategoryType {
	id: number;
	name: string;
	status: string;
}

export interface GetReviewCategoryTypeResponse {
	status_code: number;
	status: string;
	data: ReviewCategoryType[];
	pagination?: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
}

// Extended PAndLApiService with Review Category Type methods
export class ReviewCategoryTypeService {
	/**
	 * Get Review Category Types (Cost Categories)
	 * GET /api/review/getCostCategories?status=All
	 */
	static async getReviewCategoryTypes(
		page: number = 1,
		limit: number = 22,
		showAll: boolean = false,
		status?: number | string
	): Promise<GetReviewCategoryTypeResponse> {
		const params = new URLSearchParams();
		params.set('page', page.toString());
		params.set('limit', limit.toString());
		params.set('showAll', showAll.toString());
		const statusParam =
			status !== undefined ? (typeof status === 'string' ? status : status.toString()) : 'All';
		params.set('status', statusParam);

		const response = (await apiService.get<GetCostCategoriesResponse>(
			`/review/getCostCategories?${params.toString()}`
		)) as unknown as GetCostCategoriesResponse;

		// Transform CostCategory[] to ReviewCategoryType[]
		// API returns costCategories field, but we need name field
		// apiService.get already returns response.data, so response is GetCostCategoriesResponse
		const costCategories = response.data || [];
		const transformedData: ReviewCategoryType[] = costCategories.map((item: CostCategory) => ({
			id: item.id,
			name: item.costCategories, // Map costCategories to name
			status: item.status,
		}));

		return {
			status_code: response.status_code,
			status: response.status,
			data: transformedData,
			pagination: response.pagination,
		} as unknown as GetReviewCategoryTypeResponse;
	}

	/**
	 * Add Review Category Type
	 * POST /api/review/addReviewCostingCategory
	 */
	static async addReviewCategoryType(data: {
		name: string;
	}): Promise<{ status_code: number; status: string; message?: string }> {
		const response = await apiService.post<{
			status_code: number;
			status: string;
			message?: string;
		}>('/review/addReviewCostingCategory', data);
		return response as unknown as { status_code: number; status: string; message?: string };
	}

	/**
	 * Update Review Category Type
	 * PUT /api/review/updateReviewCostingCategories
	 */
	static async updateReviewCategoryType(data: {
		id: number;
		name: string;
		status: number;
	}): Promise<{ status_code: number; status: string; message?: string }> {
		const response = await apiService.put<{
			status_code: number;
			status: string;
			message?: string;
		}>('/review/updateReviewCostingCategories', data);
		return response as unknown as { status_code: number; status: string; message?: string };
	}
}

// Projected Costing Interfaces
export interface ProjectedCostingItem {
	id: number;
	date_year: string;
	facility_id: number;
	costing_type_id: number;
	city_id: number;
	projected_value: string;
	costing_type_name: string;
	city_name: string;
}

export interface OnSiteManPowerItem {
	id: number;
	client_id: number;
	client_name: string;
	costing_type_id: number;
	est: string;
	costing_type_name?: string;
	facility_id?: number;
	facility_name?: string;
	week1?: string | number | null;
	week2?: string | number | null;
	week3?: string | number | null;
	week4?: string | number | null;
	date_year?: string;
}

export interface OnSiteManPowerClient {
	id: number;
	client_id: number;
	client_name: string;
	facility_id: number;
	status: number;
	facility_name: string;
}

export interface GetOnSiteManPowerClientsResponse {
	status: string;
	data: OnSiteManPowerClient[];
}

export interface GetProjectedCostingResponse {
	status_code: number;
	status: string;
	results: {
		costingResults: ProjectedCostingItem[];
		manPowerResults?: OnSiteManPowerItem[];
	};
}

export interface GetProjectedCostingParams {
	date_year: string; // Format: YYYY-MM-01 (first day of month)
	facility_id: number;
}

// Extended PAndLApiService with Projected Costing method
export class ProjectedCostingService {
	/**
	 * Get Projected Costing
	 */
	static async getProjectedCosting(
		params: GetProjectedCostingParams
	): Promise<GetProjectedCostingResponse> {
		const response = await apiService.get<GetProjectedCostingResponse>(
			`/review/getProjectedCosting?date_year=${params.date_year}&facility_id=${params.facility_id}`
		);
		// apiService.get already returns response.data from axios
		return response as unknown as GetProjectedCostingResponse;
	}

	/**
	 * Get On-Site Manpower Clients
	 */
	static async getOnSiteManPowerClients(
		facilityId: number
	): Promise<GetOnSiteManPowerClientsResponse> {
		console.log('🔍 ProjectedCostingService.getOnSiteManPowerClients - Calling API with facilityId:', facilityId);
		const response = await apiService.get<GetOnSiteManPowerClientsResponse>(
			`/review/getOnSiteManPowerClients?facility_id=${facilityId}`
		);
		console.log('🔍 ProjectedCostingService.getOnSiteManPowerClients - Raw API response:', response);
		// apiService.get already returns response.data from axios
		// Handle different response structures
		const result = response as any;
		// If response has result field, use it; otherwise use data field
		if (result?.result && Array.isArray(result.result)) {
			return { ...result, data: result.result } as GetOnSiteManPowerClientsResponse;
		}
		return result as GetOnSiteManPowerClientsResponse;
	}
}

// Add Projected Actual Costing Interfaces
export interface ProjectedValue {
	costing_type_id: number;
	projected_value: number;
}

export interface OnSiteManPowerClientValue {
	client_id: number;
	value: number;
}

export interface AddProjectedActualCostingRequest {
	projectedValues: ProjectedValue[];
	date_year: string; // Format: YYYY-MM-01 (start of month)
	facility_id: number;
	onSiteManPower_clients: OnSiteManPowerClientValue[];
}

export interface AddProjectedActualCostingResponse {
	status_code: number;
	status: string;
	message?: string;
}

// Extended PAndLApiService with Add Projected Actual Costing method
export interface UpdateRevenueWeeklyValue {
	id: number;
	week1_actual_value: number;
	week2_actual_value: number;
	week3_actual_value: number;
	week4_actual_value: number;
}

export interface UpdateRevenueOnSiteManPowerDetail {
	id: number;
	client_id: number;
	costing_type_id: number;
	est: string;
	week1: number | null;
	week2: number | null;
	week3: number | null;
	week4: number | null;
	date_year: string;
	client_name: string;
}

export interface UpdateRevenueRequest {
	weeklyValue: UpdateRevenueWeeklyValue[];
	onSiteManPowerDetails: UpdateRevenueOnSiteManPowerDetail[];
}

export interface UpdateRevenueResponse {
	status_code: number;
	status: string;
	message?: string;
}

export class ProjectedActualCostingService {
	/**
	 * Add Projected Actual Costing
	 */
	static async addProjectedActualCosting(
		data: AddProjectedActualCostingRequest
	): Promise<AddProjectedActualCostingResponse> {
		const response = await apiService.post<AddProjectedActualCostingResponse>(
			'/review/addProjectedActualCosting',
			data
		);
		// apiService.post already returns response.data from axios
		return response as unknown as AddProjectedActualCostingResponse;
	}
}
