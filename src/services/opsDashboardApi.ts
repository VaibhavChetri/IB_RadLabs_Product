/**
 * Ops Dashboard API Service
 * Handles all API calls for Ops Dashboard reports
 */

import { apiService } from './api';

// KAM EOD Report Response
export interface KAMEodReportResponse {
	status: string;
	status_code: number;
	message: string;
	totalDays: number;
	dailyEntryStatus: Array<{
		entry_date: string;
		cities: Array<{
			city_id: number;
			cityName: string;
			totalClients: number;
			enteredClients: number;
			percentage: string;
		}>;
	}>;
	overallEntryPercentage: string;
	citySummary: Array<{
		city_id: number;
		cityName: string;
		totalDays: number;
		daysEntered: number;
		avgPercentage: string;
	}>;
}

// Transit Plan Dispatch/Pickup Summary Response
export interface TransitPlanDispatchPickupSummaryResponse {
	status: string;
	status_code: number;
	message: string;
	sent: {
		dailyEntryStatus: Array<{
			entry_date: string;
			cities: Array<{
				city_id: number;
				cityName: string;
				totalPlans: number;
				donePlans: number;
				percentage: string;
			}>;
		}>;
		overallEntryPercentage: string;
		citySummary: Array<{
			city_id: number;
			cityName: string;
			totalDays: number;
			daysEntered: number;
			avgPercentage: string;
		}>;
	};
	received: {
		dailyEntryStatus: Array<{
			entry_date: string;
			cities: Array<{
				city_id: number;
				cityName: string;
				totalPlans: number;
				donePlans: number;
				percentage: string;
			}>;
		}>;
		overallEntryPercentage: string;
		citySummary: Array<{
			city_id: number;
			cityName: string;
			totalDays: number;
			daysEntered: number;
			avgPercentage: string;
		}>;
	};
}

// QC EOD Report Response
export interface QCEodReportResponse {
	status: string;
	status_code: number;
	message: string;
	totalDays: number;
	overallEntryPercentage: string;
	dailyEntryStatus: Array<{
		entry_date: string;
		cities: Array<{
			city_id: number;
			cityName: string;
			totalClients: number;
			enteredClients: number;
			percentage: string;
			b2bCount: number;
			b2bRejected: number;
			b2bRejectedPercentage: string;
		}>;
	}>;
	citySummary: Array<{
		city_id: number;
		cityName: string;
		totalDays: number;
		daysEntered: number;
		avgPercentage: string;
		totalRejected: number;
		b2bCount: number;
		b2bRejected: number;
		b2bRejectedPercentage: string;
	}>;
}

// Dispatch Delay Report Response
export interface DispatchDelayRecord {
	facility_id: number;
	facilityName: string;
	transit_id: string;
	first_created_at: string;
	avg_transit_time: string;
	delayHours: number;
}

export interface DispatchDelayClient {
	client_id: number;
	clientName: string;
	records: DispatchDelayRecord[];
	totalDelay: string;
}

export interface DispatchDelayReportResponse {
	status: string;
	status_code: number;
	message: string;
	dailyDelayResults: Array<{
		entry_date: string;
		cities: Array<{
			city_id: number;
			cityName: string;
			clients: DispatchDelayClient[];
			totalClients: number;
			totalDelayForAllClients: string;
			avgDelay: string;
		}>;
	}>;
	citySummary: Array<{
		city_id: number;
		cityName: string;
		totalClients: number;
		totalDelayForAllClients: string;
		avgDelay: string;
	}>;
	totalDays: number;
}

// Shift Status Report Response
export interface ShiftStatusDay {
	shift: string;
	check_in: string | null;
	check_out: string | null;
	status: number;
	status_label: string;
	total_weight: number;
	total_count: number;
	man_hours: number;
	water_efficiency: number | null;
}

export interface ShiftStatusReportResponse {
	status: string;
	status_code: number;
	data: {
		summary: {
			total_days: number;
			filled_day_shifts: number;
			filled_night_shifts: number;
			completeted_day_shifts: number;
			completeted_night_shifts: number;
			day_avg_fill_rate: number;
			night_avg_fill_rate: number;
			checkin_only: number;
			checkout_only: number;
			both_checkin_and_checkout: number;
			cumulative_water_efficiency: number;
			day_water_efficiency: number;
			night_water_efficiency: number | null;
		};
		shift_report: Record<
			string,
			{
				Day: ShiftStatusDay;
				Night: ShiftStatusDay;
			}
		>;
	};
}

export class OpsDashboardApiService {
	/**
	 * Get KAM EOD Report
	 * @param cityIds - Comma-separated city IDs or single city ID
	 * @param startDate - Start date in YYYY-MM-DD format
	 * @param endDate - End date in YYYY-MM-DD format
	 * @param signal - Optional AbortSignal for request cancellation
	 */
	static async getKAMEodReport(
		cityIds: number | string,
		startDate: string,
		endDate: string,
		signal?: AbortSignal
	): Promise<KAMEodReportResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_ids', String(cityIds));
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);

		return apiService.get(`/inventory/getKAMEodReport?${searchParams.toString()}`, {
			signal,
		}) as unknown as Promise<KAMEodReportResponse>;
	}

	/**
	 * Get Transit Plan Dispatch/Pickup Summary
	 * @param cityIds - Comma-separated city IDs or single city ID
	 * @param startDate - Start date in YYYY-MM-DD format
	 * @param endDate - End date in YYYY-MM-DD format
	 * @param signal - Optional AbortSignal for request cancellation
	 */
	static async getTransitPlanDispatchPickupSummary(
		cityIds: number | string,
		startDate: string,
		endDate: string,
		signal?: AbortSignal
	): Promise<TransitPlanDispatchPickupSummaryResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_ids', String(cityIds));
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);

		return apiService.get(
			`/transit-plan/getTransitPlanDispatchPickupSummary?${searchParams.toString()}`,
			{
				signal,
			}
		) as unknown as Promise<TransitPlanDispatchPickupSummaryResponse>;
	}

	/**
	 * Get QC EOD Report
	 * @param cityIds - Comma-separated city IDs or single city ID
	 * @param startDate - Start date in YYYY-MM-DD format
	 * @param endDate - End date in YYYY-MM-DD format
	 * @param signal - Optional AbortSignal for request cancellation
	 */
	static async getQCEodReport(
		cityIds: number | string,
		startDate: string,
		endDate: string,
		signal?: AbortSignal
	): Promise<QCEodReportResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_ids', String(cityIds));
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);

		return apiService.get(`/inventory/getQCEodReport?${searchParams.toString()}`, {
			signal,
		}) as unknown as Promise<QCEodReportResponse>;
	}

	/**
	 * Get Dispatch Delay Report
	 * @param cityIds - Comma-separated city IDs or single city ID
	 * @param startDate - Start date in YYYY-MM-DD format
	 * @param endDate - End date in YYYY-MM-DD format
	 * @param signal - Optional AbortSignal for request cancellation
	 */
	static async getDispatchDelayReport(
		cityIds: number | string,
		startDate: string,
		endDate: string,
		signal?: AbortSignal
	): Promise<DispatchDelayReportResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('city_ids', String(cityIds));
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);

		return apiService.get(`/inventory/getDispatchDelayReport?${searchParams.toString()}`, {
			signal,
		}) as unknown as Promise<DispatchDelayReportResponse>;
	}

	/**
	 * Get Shift Status Report
	 * @param startDate - Start date in YYYY-MM-DD format
	 * @param endDate - End date in YYYY-MM-DD format
	 * @param signal - Optional AbortSignal for request cancellation
	 */
	static async getShiftStatusReport(
		startDate: string,
		endDate: string,
		signal?: AbortSignal
	): Promise<ShiftStatusReportResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('start_date', startDate);
		searchParams.set('end_date', endDate);

		return apiService.get(`/shift/getShiftStatusReport?${searchParams.toString()}`, {
			signal,
		}) as unknown as Promise<ShiftStatusReportResponse>;
	}
}
