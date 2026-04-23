/**
 * Export Impact Home dashboard report to Excel
 * Uses existing project excelExport utility
 */

import * as XLSX from 'xlsx';
import type { DashboardKAMResponse } from '../../../services/inventoryApi';
import type { DashboardStats } from '../hooks/useDashboardData';

const SHEET_SUMMARY = 'Summary';
const SHEET_DAILY = 'Daily Data';

/**
 * Export dashboard report to Excel: Summary sheet (stats) + Daily Data sheet (by date)
 */
export function exportDashboardToExcel(
	stats: DashboardStats | null,
	rawData: DashboardKAMResponse | null,
	year: string,
	month: string
): void {
	const workbook = XLSX.utils.book_new();
	const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];
	const monthLabel = monthNames[parseInt(month, 10) - 1] || month;
	const filenameBase = `Impact_Home_Report_${year}_${monthLabel}`;

	// Sheet 1: Summary
	const summaryRows: (string | number)[][] = [
		['Impact Home Dashboard Report'],
		['Period', `${monthLabel} ${year}`],
		[],
		['Metric', 'Value'],
		['Total Container Units', stats?.totalClientSKUCount ?? 0],
		['Average Container Units', stats?.totalClientAvgSKUCount ?? 0],
		['Plastic Saved (kg)', stats?.totalPlasticSavedKg ?? 0],
		['Water Saved (L)', stats?.water ?? 0],
		['GHG Emissions Reduced (kg CO₂e)', stats?.ghc ?? 0],
	];
	const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
	wsSummary['!cols'] = [{ wch: 32 }, { wch: 18 }];
	XLSX.utils.book_append_sheet(workbook, wsSummary, SHEET_SUMMARY);

	// Sheet 2: Daily data – every day of the month with count (0 if not in API)
	const byDate = rawData?.segResult?.byDate ?? {};
	const yearNum = parseInt(year, 10);
	const monthNum = parseInt(month, 10);
	const daysInMonth = new Date(yearNum, monthNum, 0).getDate(); // last day = number of days

	const dailyRows: (string | number)[][] = [['Date', 'Day', 'Count']];
	for (let day = 1; day <= daysInMonth; day++) {
		const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		const seg = byDate[dateStr];
		const count = seg?.totalCount ?? 0;
		dailyRows.push([dateStr, day, count]);
	}
	const wsDaily = XLSX.utils.aoa_to_sheet(dailyRows);
	wsDaily['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 12 }];
	XLSX.utils.book_append_sheet(workbook, wsDaily, SHEET_DAILY);

	XLSX.writeFile(workbook, `${filenameBase}_${timestamp}.xlsx`);
}

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

/**
 * Build daily rows for a given month from API byDate (every day listed, 0 if missing)
 */
function buildDailyRowsForMonth(
	year: number,
	monthNum: number,
	byDate: Record<string, { totalCount: number; day: string }>
): (string | number)[][] {
	const daysInMonth = new Date(year, monthNum, 0).getDate();
	const rows: (string | number)[][] = [['Date', 'Day', 'Count']];
	const yearStr = year.toString();
	const monthStr = String(monthNum).padStart(2, '0');
	for (let day = 1; day <= daysInMonth; day++) {
		const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
		const seg = byDate[dateStr];
		rows.push([dateStr, day, seg?.totalCount ?? 0]);
	}
	return rows;
}

/**
 * Export full year report: Year Summary sheet + one sheet per month (every day with count)
 * rawDataPerMonth: array of 12 items (Jan = index 0, Dec = index 11), each DashboardKAMResponse | null
 */
export function exportDashboardYearlyToExcel(
	rawDataPerMonth: (DashboardKAMResponse | null)[],
	year: string
): void {
	const workbook = XLSX.utils.book_new();
	const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
	const yearNum = parseInt(year, 10);
	const filenameBase = `Impact_Home_Yearly_Report_${year}`;

	// Sheet 1: Year Summary – month name, total container units, plastic saved, water, ghc per month
	const summaryRows: (string | number)[][] = [
		['Impact Home Dashboard – Yearly Report'],
		['Year', year],
		[],
		['Month', 'Total Container Units', 'Plastic Saved (kg)', 'Water Saved (L)', 'GHG (kg CO₂e)'],
	];
	for (let m = 0; m < 12; m++) {
		const data = rawDataPerMonth[m];
		const totalUnits = data?.summaryCount?.totalSummary?.totalClientSKUCount ?? 0;
		const plastic = data?.total?.totalPlasticSavedKg ?? 0;
		const water = data?.total?.water ?? 0;
		const ghc = data?.total?.ghc ?? 0;
		summaryRows.push([MONTH_NAMES[m], totalUnits, plastic, water, ghc]);
	}
	// Totals row
	const totalUnits = summaryRows.slice(4).reduce((sum, row) => sum + (Number(row[1]) || 0), 0);
	const totalPlastic = summaryRows.slice(4).reduce((sum, row) => sum + (Number(row[2]) || 0), 0);
	const totalWater = summaryRows.slice(4).reduce((sum, row) => sum + (Number(row[3]) || 0), 0);
	const totalGhc = summaryRows.slice(4).reduce((sum, row) => sum + (Number(row[4]) || 0), 0);
	summaryRows.push(['Total', totalUnits, totalPlastic, totalWater, totalGhc]);

	const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
	wsSummary['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
	XLSX.utils.book_append_sheet(workbook, wsSummary, 'Year Summary');

	// Sheets 2–13: January … December (every day of that month)
	for (let m = 0; m < 12; m++) {
		const data = rawDataPerMonth[m];
		const byDate = data?.segResult?.byDate ?? {};
		const monthNum = m + 1;
		const dailyRows = buildDailyRowsForMonth(yearNum, monthNum, byDate);
		const ws = XLSX.utils.aoa_to_sheet(dailyRows);
		ws['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 12 }];
		const sheetName = MONTH_NAMES[m].slice(0, 31); // Excel sheet name max 31 chars
		XLSX.utils.book_append_sheet(workbook, ws, sheetName);
	}

	XLSX.writeFile(workbook, `${filenameBase}_${timestamp}.xlsx`);
}
