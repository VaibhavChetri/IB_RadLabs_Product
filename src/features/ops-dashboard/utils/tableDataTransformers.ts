/**
 * Ops Dashboard Table Data Transformers
 * Transforms API responses into table-ready format
 */

import {
	KAMEodReportResponse,
	TransitPlanDispatchPickupSummaryResponse,
	QCEodReportResponse,
	DispatchDelayReportResponse,
	ShiftStatusReportResponse,
} from '../../../services/opsDashboardApi';

export interface OpsDashboardTableRow {
	cityId: number;
	cityName: string;
	facilityReport: {
		day: string; // "3/7 (42.86%)"
		night: string; // "1/7 (14.29%)"
	};
	qcRejection: string; // "--" (no data available)
	transitDelay: {
		day: string; // "3/7 (63.02%)"
		night: string; // "1/7 (0%)"
	};
	washingEfficiency: {
		sent: string; // "6/7 (26.36%)"
		// received: string; // "0/7 (0.00%)" - Commented out, not available
	};
	transitPlanFilled: string; // "1.91"
	driverCheckin: string; // "--" (no data available)
	kamEodReport: string; // "5/7 (70.41%)"
	[key: string]: unknown; // Index signature for Table component compatibility
}

/**
 * Transform all API responses into table rows grouped by city
 */
export const transformToTableData = (
	kamEodData: KAMEodReportResponse | null,
	transitPlanData: TransitPlanDispatchPickupSummaryResponse | null,
	qcEodData: QCEodReportResponse | null,
	dispatchDelayData: DispatchDelayReportResponse | null,
	shiftStatusData: ShiftStatusReportResponse | null
): OpsDashboardTableRow[] => {
	// Collect all unique cities from all APIs
	const cityMap = new Map<number, { cityId: number; cityName: string }>();

	// Extract cities from each API response
	if (kamEodData?.citySummary) {
		kamEodData.citySummary.forEach(city => {
			cityMap.set(city.city_id, { cityId: city.city_id, cityName: city.cityName });
		});
	}

	if (transitPlanData?.sent?.citySummary) {
		transitPlanData.sent.citySummary.forEach(city => {
			cityMap.set(city.city_id, { cityId: city.city_id, cityName: city.cityName });
		});
	}

	if (transitPlanData?.received?.citySummary) {
		transitPlanData.received.citySummary.forEach(city => {
			cityMap.set(city.city_id, { cityId: city.city_id, cityName: city.cityName });
		});
	}

	if (qcEodData?.citySummary) {
		qcEodData.citySummary.forEach(city => {
			cityMap.set(city.city_id, { cityId: city.city_id, cityName: city.cityName });
		});
	}

	if (dispatchDelayData?.citySummary) {
		dispatchDelayData.citySummary.forEach(city => {
			cityMap.set(city.city_id, { cityId: city.city_id, cityName: city.cityName });
		});
	}

	// Build table rows for each city
	const rows: OpsDashboardTableRow[] = Array.from(cityMap.values()).map(city => {
		const cityId = city.cityId;

		// Facility Report (Day/Night from Shift Status)
		const facilityReport = getFacilityReport(shiftStatusData, cityId);

		// QC Rejection (no data available)
		const qcRejection = '--';

		// Transit Delay (Day/Night from Shift Status)
		const transitDelay = getTransitDelay(shiftStatusData, cityId);

		// Washing Efficiency (Sent only)
		const washingEfficiency = getWashingEfficiency(transitPlanData, cityId);

		// Transit Plan Filled (avgDelay from Dispatch Delay Report)
		const transitPlanFilled = getTransitPlanFilled(dispatchDelayData, cityId);

		// Driver Checkin (no data available)
		const driverCheckin = '--';

		// KAM EOD Report
		const kamEodReport = getKamEodReport(kamEodData, cityId);

		return {
			cityId,
			cityName: city.cityName,
			facilityReport,
			qcRejection,
			transitDelay,
			washingEfficiency,
			transitPlanFilled,
			driverCheckin,
			kamEodReport,
		};
	});

	return rows.sort((a, b) => a.cityName.localeCompare(b.cityName));
};

/**
 * Get Facility Report (Day/Night shifts filled)
 */
const getFacilityReport = (
	shiftStatusData: ShiftStatusReportResponse | null,
	_cityId: number
): { day: string; night: string } => {
	if (!shiftStatusData?.data?.summary) {
		return { day: '-', night: '-' };
	}

	const summary = shiftStatusData.data.summary;
	const totalDays = summary.total_days || 0;
	const dayFilled = summary.filled_day_shifts || 0;
	const nightFilled = summary.filled_night_shifts || 0;

	return {
		day: `${dayFilled}/${totalDays}`,
		night: `${nightFilled}/${totalDays}`,
	};
};

/**
 * Get Transit Delay (Day/Night from Shift Status)
 */
const getTransitDelay = (
	shiftStatusData: ShiftStatusReportResponse | null,
	_cityId: number
): { day: string; night: string } => {
	if (!shiftStatusData?.data?.summary) {
		return { day: '-', night: '-' };
	}

	const summary = shiftStatusData.data.summary;
	const totalDays = summary.total_days || 0;
	const dayFilled = summary.filled_day_shifts || 0;
	const nightFilled = summary.filled_night_shifts || 0;

	return {
		day: `${dayFilled}/${totalDays}`,
		night: `${nightFilled}/${totalDays}`,
	};
};

/**
 * Get Washing Efficiency (Sent only - Received commented out)
 */
const getWashingEfficiency = (
	transitPlanData: TransitPlanDispatchPickupSummaryResponse | null,
	cityId: number
): { sent: string } => {
	if (!transitPlanData) {
		return { sent: '-' };
	}

	const sentCity = transitPlanData.sent?.citySummary?.find(c => c.city_id === cityId);

	const sentDays = sentCity?.totalDays || 0;
	const sentEntered = sentCity?.daysEntered || 0;

	return {
		sent: `${sentEntered}/${sentDays}`,
		// received: `${receivedEntered}/${receivedDays}`, // Commented out, not available
	};
};

/**
 * Get Transit Plan Filled (avgDelay from Dispatch Delay Report)
 */
const getTransitPlanFilled = (
	dispatchDelayData: DispatchDelayReportResponse | null,
	cityId: number
): string => {
	if (!dispatchDelayData?.citySummary) {
		return '-';
	}

	const cityData = dispatchDelayData.citySummary.find(c => c.city_id === cityId);
	if (!cityData) {
		return '-';
	}

	return cityData.avgDelay || '-';
};

/**
 * Get KAM EOD Report percentage
 */
const getKamEodReport = (kamEodData: KAMEodReportResponse | null, cityId: number): string => {
	if (!kamEodData?.citySummary) {
		return '-';
	}

	const cityData = kamEodData.citySummary.find(c => c.city_id === cityId);
	if (!cityData) {
		return '-';
	}

	const totalDays = kamEodData.totalDays || 0;
	const daysEntered = cityData.daysEntered || 0;

	return `${daysEntered}/${totalDays}`;
};
