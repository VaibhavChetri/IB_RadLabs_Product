/**
 * P&L API Service
 * Handles Profit & Loss related API calls
 */

import { apiService } from './api';

// Request Interfaces
export interface GetRevenueParams {
	facility_id: number;
	start_date: string;
	end_date: string;
	page: number;
	limit: number;
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
		searchParams.set('facility_id', params.facility_id.toString());
		searchParams.set('start_date', params.start_date);
		searchParams.set('end_date', params.end_date);
		searchParams.set('page', params.page.toString());
		searchParams.set('limit', params.limit.toString());

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
}
