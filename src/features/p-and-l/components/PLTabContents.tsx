/**
 * P&L Tab Content Components
 * Each component handles its own API calls and rendering
 */

import React from 'react';
import {
	useExpenditureData,
	useUnitEconomicsData,
	useClientWisePLData,
	useEscalationData,
} from '../hooks/usePLTabData';
import { Table, TableColumn } from '../../../components/ui/DataDisplay';

interface PLTabContentProps {
	cityId?: number;
	facilityId: string;
	month: string;
	year: string;
	enabled?: boolean;
	onError?: (message: string) => void;
}

/**
 * Get week column background color
 */
const getWeekBgColor = (week: 'w1' | 'w2' | 'w3' | 'w4'): string => {
	switch (week) {
		case 'w1':
			return 'bg-blue-50';
		case 'w2':
			return 'bg-pink-50';
		case 'w3':
			return 'bg-green-50';
		case 'w4':
			return 'bg-orange-50';
		default:
			return 'bg-white';
	}
};

/**
 * Get delta column background color (lighter shade of week color)
 */
const getDeltaBgColor = (week: 'w1' | 'w2' | 'w3' | 'w4'): string => {
	switch (week) {
		case 'w1':
			return 'bg-blue-100';
		case 'w2':
			return 'bg-pink-100';
		case 'w3':
			return 'bg-green-100';
		case 'w4':
			return 'bg-orange-100';
		default:
			return 'bg-gray-50';
	}
};

/**
 * Format number to 2 decimal places or return dash for zero/null
 */
const formatUnitValue = (
	value: number | string | null | undefined,
	isTotal: boolean = false
): string => {
	if (value === null || value === undefined || value === '') return '-';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (isNaN(num)) return '-';
	if (num === 0 && !isTotal) return '-';
	return num.toFixed(2);
};

/**
 * Format number with commas or return dash for zero/null
 */
const formatExpenditureValue = (
	value: number | string | null | undefined,
	isTotal: boolean = false
): string => {
	if (value === null || value === undefined || value === '') return '-';
	const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
	if (isNaN(num)) return '-';
	if (num === 0 && !isTotal) return '-';
	return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

/**
 * Expenditure Tab Content
 */
export const ExpenditureTab: React.FC<PLTabContentProps> = ({
	facilityId,
	month,
	year,
	enabled = false,
	onError,
}) => {
	const { data, isLoading, error } = useExpenditureData(facilityId, month, year, enabled);

	// Handle API errors with Snackbar
	React.useEffect(() => {
		if (error && onError) {
			onError(`Failed to load expenditure data: ${error.message}`);
		}
	}, [error, onError]);

	// Define table columns
	const columns: TableColumn<Record<string, unknown>>[] = React.useMemo(
		() => [
			{
				key: 'slNo',
				title: 'SL',
				align: 'left',
				width: '60px',
				sortable: false,
				cellClassName: 'text-xs',
			},
			{
				key: 'costingTypeName',
				title: 'Costing Type',
				align: 'left',
				width: '200px',
				sortable: true,
				cellClassName: 'text-xs',
			},
			{
				key: 'projected_value',
				title: 'Projection',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatExpenditureValue(record.projected_value as number | string | null | undefined),
			},
			{
				key: 'week1_actual_value',
				title: 'W1',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w1') + ' px-2 py-1 rounded block text-right'}>
						{formatExpenditureValue(
							record.week1_actual_value as number | string | null | undefined
						)}
					</span>
				),
			},
			{
				key: 'week1_delta_with_percentage',
				title: 'Delta(W1)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w1') + ' px-2 py-1 rounded block text-right'}>
						{(record.week1_delta_with_percentage as string) || '-'}
					</span>
				),
			},
			{
				key: 'week2_actual_value',
				title: 'W2',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w2') + ' px-2 py-1 rounded block text-right'}>
						{formatExpenditureValue(
							record.week2_actual_value as number | string | null | undefined
						)}
					</span>
				),
			},
			{
				key: 'week2_delta_with_percentage',
				title: 'Delta(W2)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w2') + ' px-2 py-1 rounded block text-right'}>
						{(record.week2_delta_with_percentage as string) || '-'}
					</span>
				),
			},
			{
				key: 'week3_actual_value',
				title: 'W3',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w3') + ' px-2 py-1 rounded block text-right'}>
						{formatExpenditureValue(
							record.week3_actual_value as number | string | null | undefined
						)}
					</span>
				),
			},
			{
				key: 'week3_delta_with_percentage',
				title: 'Delta(W3)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w3') + ' px-2 py-1 rounded block text-right'}>
						{(record.week3_delta_with_percentage as string) || '-'}
					</span>
				),
			},
			{
				key: 'week4_actual_value',
				title: 'W4',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w4') + ' px-2 py-1 rounded block text-right'}>
						{formatExpenditureValue(
							record.week4_actual_value as number | string | null | undefined
						)}
					</span>
				),
			},
			{
				key: 'week4_delta_with_percentage',
				title: 'Delta(W4)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w4') + ' px-2 py-1 rounded block text-right'}>
						{(record.week4_delta_with_percentage as string) || '-'}
					</span>
				),
			},
			{
				key: 'total_actual_value',
				title: 'Total Actual',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatExpenditureValue(
						record.total_actual_value as number | string | null | undefined,
						true
					),
			},
			{
				key: 'total_delta_with_percentage',
				title: 'Total Delta',
				align: 'right',
				sortable: true,
				render: (_value, record) => (record.total_delta_with_percentage as string) || '-',
			},
		],
		[]
	);

	// Transform data for table
	const tableData = React.useMemo(() => {
		if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) return [];

		// Extract records from nested structure: data[0].facilities[0].monthYearData[0].records
		const cityData = data.data[0];
		if (!cityData?.facilities || cityData.facilities.length === 0) return [];

		const facilityData = cityData.facilities[0];
		if (!facilityData?.monthYearData || facilityData.monthYearData.length === 0) return [];

		const monthYearData = facilityData.monthYearData[0];
		const records = monthYearData.records || [];

		if (records.length === 0) return [];

		// Define interface for expenditure record
		interface ExpenditureRecord {
			costingTypeName: string;
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
		}

		// Transform records to table rows
		const rows: Array<Record<string, unknown>> = (records as ExpenditureRecord[]).map(
			(record: ExpenditureRecord, index: number) => ({
				slNo: index + 1,
				costingTypeName: record.costingTypeName || '-',
				projected_value: record.projected_value,
				week1_actual_value: record.week1_actual_value,
				week1_delta_with_percentage: record.week1_delta_with_percentage,
				week2_actual_value: record.week2_actual_value,
				week2_delta_with_percentage: record.week2_delta_with_percentage,
				week3_actual_value: record.week3_actual_value,
				week3_delta_with_percentage: record.week3_delta_with_percentage,
				week4_actual_value: record.week4_actual_value,
				week4_delta_with_percentage: record.week4_delta_with_percentage,
				total_actual_value: record.total_actual_value,
				total_delta_with_percentage: record.total_delta_with_percentage,
			})
		);

		// Calculate totals
		const totalProjected = (records as ExpenditureRecord[]).reduce(
			(sum: number, record: ExpenditureRecord) => {
				const val = parseFloat(String(record.projected_value || 0).replace(/,/g, ''));
				return sum + (isNaN(val) ? 0 : val);
			},
			0
		);

		const totalW1 = (records as ExpenditureRecord[]).reduce(
			(sum: number, record: ExpenditureRecord) => {
				const val = parseFloat(String(record.week1_actual_value || 0).replace(/,/g, ''));
				return sum + (isNaN(val) ? 0 : val);
			},
			0
		);

		const totalW2 = (records as ExpenditureRecord[]).reduce(
			(sum: number, record: ExpenditureRecord) => {
				const val = parseFloat(String(record.week2_actual_value || 0).replace(/,/g, ''));
				return sum + (isNaN(val) ? 0 : val);
			},
			0
		);

		const totalW3 = (records as ExpenditureRecord[]).reduce(
			(sum: number, record: ExpenditureRecord) => {
				const val = parseFloat(String(record.week3_actual_value || 0).replace(/,/g, ''));
				return sum + (isNaN(val) ? 0 : val);
			},
			0
		);

		const totalW4 = (records as ExpenditureRecord[]).reduce(
			(sum: number, record: ExpenditureRecord) => {
				const val = parseFloat(String(record.week4_actual_value || 0).replace(/,/g, ''));
				return sum + (isNaN(val) ? 0 : val);
			},
			0
		);

		const totalActual = (records as ExpenditureRecord[]).reduce(
			(sum: number, record: ExpenditureRecord) => {
				const val = parseFloat(String(record.total_actual_value || 0).replace(/,/g, ''));
				return sum + (isNaN(val) ? 0 : val);
			},
			0
		);

		// Calculate total deltas
		const totalDeltaW1 = totalW1 - totalProjected / 4; // Approximate per-week projection
		const totalDeltaW2 = totalW2 - totalProjected / 4;
		const totalDeltaW3 = totalW3 - totalProjected / 4;
		const totalDeltaW4 = totalW4 - totalProjected / 4;
		const totalDelta = totalActual - totalProjected;

		// Format total delta percentages
		const formatDeltaWithPercentage = (delta: number, projected: number): string => {
			if (projected === 0) return delta === 0 ? '0(0%)' : `${delta.toLocaleString()}(0%)`;
			const percentage = ((delta / projected) * 100).toFixed(0);
			return `${delta.toLocaleString()}(${percentage}%)`;
		};

		const totalRow: Record<string, unknown> = {
			slNo: '-',
			costingTypeName: 'Total',
			projected_value: totalProjected,
			week1_actual_value: totalW1,
			week1_delta_with_percentage: formatDeltaWithPercentage(totalDeltaW1, totalProjected / 4),
			week2_actual_value: totalW2,
			week2_delta_with_percentage: formatDeltaWithPercentage(totalDeltaW2, totalProjected / 4),
			week3_actual_value: totalW3,
			week3_delta_with_percentage: formatDeltaWithPercentage(totalDeltaW3, totalProjected / 4),
			week4_actual_value: totalW4,
			week4_delta_with_percentage: formatDeltaWithPercentage(totalDeltaW4, totalProjected / 4),
			total_actual_value: totalActual,
			total_delta_with_percentage: formatDeltaWithPercentage(totalDelta, totalProjected),
			isTotal: true,
		};

		return [...rows, totalRow];
	}, [data]);

	if (isLoading) {
		return (
			<div className='p-6 text-center'>
				<p className='text-gray-600'>Loading expenditure data...</p>
			</div>
		);
	}

	return (
		<div className='p-6'>
			<h2 className='text-xl font-semibold text-gray-900 mb-4'>Expenditure Listing</h2>
			<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<Table
					columns={columns}
					data={tableData}
					loading={isLoading}
					emptyText='No expenditure data available'
					size='sm'
				/>
			</div>
		</div>
	);
};

export const UnitEconomicsTab: React.FC<PLTabContentProps> = ({
	cityId,
	facilityId,
	month,
	year,
	enabled = false,
	onError,
}) => {
	const { data, isLoading, error } = useUnitEconomicsData(cityId, facilityId, month, year, enabled);

	// Handle API errors with Snackbar
	React.useEffect(() => {
		if (error && onError) {
			onError(`Failed to load unit economics data: ${error.message}`);
		}
	}, [error, onError]);

	// Define table columns
	const columns: TableColumn<Record<string, unknown>>[] = React.useMemo(
		() => [
			{
				key: 'slNo',
				title: 'SL',
				align: 'left',
				width: '60px',
				sortable: false,
				cellClassName: 'text-xs',
			},
			{
				key: 'costingTypeName',
				title: 'Costing Type',
				align: 'left',
				width: '200px',
				sortable: true,
				cellClassName: 'text-xs',
			},
			{
				key: 'projectValue',
				title: 'Projection',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatUnitValue(record.projectValue as number | string | null | undefined),
			},
			{
				key: 'week1_actual_value',
				title: 'W1',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w1') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week1_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week1Delta',
				title: 'Delta(W1)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w1') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week1Delta as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week2_actual_value',
				title: 'W2',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w2') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week2_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week2Delta',
				title: 'Delta(W2)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w2') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week2Delta as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week3_actual_value',
				title: 'W3',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w3') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week3_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week3Delta',
				title: 'Delta(W3)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w3') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week3Delta as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week4_actual_value',
				title: 'W4',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getWeekBgColor('w4') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week4_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week4Delta',
				title: 'Delta(W4)',
				align: 'right',
				sortable: true,
				render: (_value, record) => (
					<span className={getDeltaBgColor('w4') + ' px-2 py-1 rounded block text-right'}>
						{formatUnitValue(record.week4Delta as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'aggrUnit',
				title: 'Aggr Unit',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatUnitValue(record.aggrUnit as number | string | null | undefined),
			},
		],
		[]
	);

	// Transform data for table
	const tableData = React.useMemo(() => {
		if (!data?.updateUnitEconomics) return [];

		const items = data.updateUnitEconomics || [];
		const total = data.total || {};

		// Define interface for unit economics item
		interface UnitEconomicsItem {
			costingTypeId: number;
			costingTypeName: string;
			facilityId: number;
			projectValue: string | number;
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

		// Transform items to table rows
		const rows: Array<Record<string, unknown>> = (items as UnitEconomicsItem[]).map(
			(item: UnitEconomicsItem, index: number) => ({
				slNo: index + 1,
				costingTypeName: item.costingTypeName || '-',
				projectValue: item.projectValue,
				week1_actual_value: item.week1_actual_value,
				week1Delta: item.week1Delta,
				week2_actual_value: item.week2_actual_value,
				week2Delta: item.week2Delta,
				week3_actual_value: item.week3_actual_value,
				week3Delta: item.week3Delta,
				week4_actual_value: item.week4_actual_value,
				week4Delta: item.week4Delta,
				aggrUnit: item.aggrUnit,
			})
		);

		// Add total row
		const totalRow: Record<string, unknown> = {
			slNo: '-',
			costingTypeName: 'Total',
			projectValue: total.projectedUnitValueTotal,
			week1_actual_value: total.week1UnitTotal,
			week1Delta: total.week1DeltaTotal,
			week2_actual_value: total.week2UnitTotal,
			week2Delta: total.week2DeltaTotal,
			week3_actual_value: total.week3UnitTotal,
			week3Delta: total.week3DeltaTotal,
			week4_actual_value: total.week4UnitTotal,
			week4Delta: total.week4DeltaTotal,
			aggrUnit: total.aggrUnitTotal,
			isTotal: true,
		};

		return [...rows, totalRow];
	}, [data]);

	if (isLoading) {
		return (
			<div className='p-6 text-center'>
				<p className='text-gray-600'>Loading unit economics data...</p>
			</div>
		);
	}

	return (
		<div className='p-6'>
			<h2 className='text-xl font-semibold text-gray-900 mb-4'>Unit Economics Listing</h2>
			<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<Table
					columns={columns}
					data={tableData}
					loading={isLoading}
					emptyText='No unit economics data available'
					size='sm'
				/>
			</div>
		</div>
	);
};

/**
 * EBITDA Tab Content
 * Re-exported from dedicated component file
 */
export { EBITDATab } from './EBITDATab';

/**
 * Client Wise P&L Tab Content
 */
export const ClientWisePLTab: React.FC<PLTabContentProps> = ({
	cityId,
	facilityId,
	month,
	year,
	enabled: _enabled,
	onError,
}) => {
	// React Query will automatically deduplicate this call with the page-level hook
	// Both use the same queryKey, so they share the same query instance
	const { data, isLoading, error } = useClientWisePLData(cityId, facilityId, month, year, true);

	// Handle API errors with Snackbar
	React.useEffect(() => {
		if (error && onError) {
			onError(`Failed to load client wise P&L data: ${error.message}`);
		}
	}, [error, onError]);

	// Format number with commas
	const formatNumber = (value: number | string | null | undefined): string => {
		if (value === null || value === undefined || value === '') return '-';
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '-';
		return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
	};

	// Define table columns (must be before early returns)
	const columns: TableColumn<Record<string, unknown>>[] = React.useMemo(
		() => [
			{
				key: 'slNo',
				title: 'SL',
				align: 'left',
				width: '80px',
				sortable: false,
			},
			{
				key: 'clientName',
				title: 'Client',
				align: 'left',
				width: '200px',
				sortable: true,
			},
			{
				key: 'skuCount',
				title: 'SKU',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.skuCount as number | string | null | undefined),
			},
			{
				key: 'opdCount',
				title: 'OPD',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.opdCount as number | string | null | undefined),
			},
			{
				key: 'price',
				title: 'Price',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.price as number | string | null | undefined),
			},
			{
				key: 'revPerPlate',
				title: 'Rev/Plate',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.revPerPlate as number | string | null | undefined),
			},
			{
				key: 'manpower',
				title: 'Manpower',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.manpower as number | string | null | undefined),
			},
			{
				key: 'electricity',
				title: 'Electricity',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.electricity as number | string | null | undefined),
			},
			{
				key: 'water',
				title: 'Water',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.water as number | string | null | undefined),
			},
			{
				key: 'consumables',
				title: 'Consumables',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.consumables as number | string | null | undefined),
			},
			{
				key: 'chemicals',
				title: 'Chemicals',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.chemicals as number | string | null | undefined),
			},
			{
				key: 'logistics',
				title: 'Logistics',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.logistics as number | string | null | undefined),
			},
			{
				key: 'monthlyRevenueEst',
				title: 'Monthly Rev',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.monthlyRevenueEst as number | string | null | undefined),
			},
			{
				key: 'onSiteManpower',
				title: 'On Site MP',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.onSiteManpower as number | string | null | undefined),
			},
			{
				key: 'contribution',
				title: 'Contribution',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.contribution as number | string | null | undefined),
			},
			{
				key: 'marginPercentage',
				title: 'Margin %',
				align: 'right',
				sortable: true,
				render: (_value, record) =>
					formatNumber(record.marginPercentage as number | string | null | undefined),
			},
		],
		[]
	);

	// Transform data for table
	const tableData = React.useMemo(() => {
		if (!data?.clientWiseData) {
			console.log('No clientWiseData found', data);
			return [];
		}

		const totals = data.clientWiseData;
		const clients = totals.data || [];

		console.log('Transforming data:', { totals, clientsCount: clients.length });

		// Create Total row
		const totalRow: Record<string, unknown> = {
			slNo: '-',
			clientName: '-',
			skuCount: '-',
			opdCount: totals.totalOpdCount,
			price: totals.totalPrice,
			revPerPlate: totals.revenuePerPlate,
			manpower: totals.manpower,
			electricity: totals.electricity,
			water: totals.water,
			consumables: totals.consumables,
			chemicals: totals.chemicals,
			logistics: totals.logistics,
			monthlyRevenueEst: totals.monthlyRevenueEst,
			onSiteManpower: totals.onSiteManpower,
			contribution: totals.contribution,
			marginPercentage: totals.marginPercentage,
			isTotal: true,
		};

		// Create client rows
		const clientRows: Record<string, unknown>[] = clients.map((client, index) => ({
			slNo: index + 1,
			clientName: client.clientName || '-',
			skuCount: client.skuCount || '-',
			opdCount: client.opdCount || '-',
			price: client.price,
			revPerPlate: client.revPerPlate,
			manpower: client.Manpower || 0,
			electricity: client.Electricity || 0,
			water: client.Water || 0,
			consumables: client.Consumables || 0,
			chemicals: client.Chemicals || 0,
			logistics: client.Logistics || 0,
			monthlyRevenueEst: client['Monthly Revenue Est'] || 0,
			onSiteManpower: client['On Site Manpower'] || 0,
			contribution: client.contribution || 0,
			marginPercentage: client.marginPercentage,
			isTotal: false,
		}));

		const result = [totalRow, ...clientRows];
		console.log('Table data result:', result.length, 'rows', result[0]);
		return result;
	}, [data]);

	if (isLoading) {
		return (
			<div className='p-6 text-center'>
				<p className='text-gray-600'>Loading client wise P&L data...</p>
			</div>
		);
	}

	console.log('Rendering table with:', {
		tableDataLength: tableData.length,
		columnsLength: columns.length,
	});

	return (
		<div className='p-6'>
			<h2 className='text-xl font-semibold text-gray-900 mb-4'>Client Wise P&L Listing</h2>
			<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<Table
					columns={columns}
					data={tableData}
					loading={isLoading}
					emptyText='No data available'
					striped={false}
					hoverable={true}
				/>
			</div>
		</div>
	);
};

/**
 * Format number or return dash
 * Returns "-" for 0 or null/undefined, except for totals which show "0"
 */
const formatEscalationValue = (
	value: number | string | null | undefined,
	isTotal: boolean = false
): string => {
	if (value === null || value === undefined || value === '') return '-';
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (isNaN(num)) return '-';
	if (num === 0) return isTotal ? '0' : '-';
	return num.toString();
};

/**
 * Escalations Tab Content
 */
export const EscalationsTab: React.FC<PLTabContentProps> = ({
	cityId,
	facilityId,
	month,
	year,
	enabled: _enabled,
	onError,
}) => {
	const { data, isLoading, error } = useEscalationData(cityId, facilityId, month, year, true);

	// Handle API errors with Snackbar
	React.useEffect(() => {
		if (error && onError) {
			onError(`Failed to load escalations data: ${error.message}`);
		}
	}, [error, onError]);

	// Transform client-wise escalation data
	const clientEscalationData = React.useMemo(() => {
		if (!data?.totalEscalationClientWiseByWeek) return [];

		const { week1, week2, week3, week4 } = data.totalEscalationClientWiseByWeek;
		const allClients = new Set<string>();

		// Collect all unique client names
		[week1, week2, week3, week4].forEach(week => {
			Object.keys(week || {}).forEach(client => allClients.add(client));
		});

		// Create rows for each client
		const clientRows: Array<{
			slNo: number;
			clientName: string;
			w1: number;
			w1Delta: number | string;
			w2: number;
			w2Delta: number | string;
			w3: number;
			w3Delta: number | string;
			w4: number;
			w4Delta: number | string;
			isTotal?: boolean;
		}> = Array.from(allClients).map((clientName, index) => {
			// Extract count and delta from each week (structure: { count: number, delta: number })
			const w1Data = week1?.[clientName];
			const w2Data = week2?.[clientName];
			const w3Data = week3?.[clientName];
			const w4Data = week4?.[clientName];

			const w1Value =
				typeof w1Data === 'object' && w1Data !== null && !Array.isArray(w1Data)
					? (w1Data as { count?: number }).count || 0
					: typeof w1Data === 'number'
						? w1Data
						: 0;
			const w2Value =
				typeof w2Data === 'object' && w2Data !== null && !Array.isArray(w2Data)
					? (w2Data as { count?: number }).count || 0
					: typeof w2Data === 'number'
						? w2Data
						: 0;
			const w3Value =
				typeof w3Data === 'object' && w3Data !== null && !Array.isArray(w3Data)
					? (w3Data as { count?: number }).count || 0
					: typeof w3Data === 'number'
						? w3Data
						: 0;
			const w4Value =
				typeof w4Data === 'object' && w4Data !== null && !Array.isArray(w4Data)
					? (w4Data as { count?: number }).count || 0
					: typeof w4Data === 'number'
						? w4Data
						: 0;

			// Extract deltas from API response if available
			const w1DeltaData =
				typeof w1Data === 'object' && w1Data !== null && !Array.isArray(w1Data)
					? (w1Data as { delta?: number }).delta
					: undefined;
			const w2DeltaData =
				typeof w2Data === 'object' && w2Data !== null && !Array.isArray(w2Data)
					? (w2Data as { delta?: number }).delta
					: undefined;
			const w3DeltaData =
				typeof w3Data === 'object' && w3Data !== null && !Array.isArray(w3Data)
					? (w3Data as { delta?: number }).delta
					: undefined;
			const w4DeltaData =
				typeof w4Data === 'object' && w4Data !== null && !Array.isArray(w4Data)
					? (w4Data as { delta?: number }).delta
					: undefined;

			// Use delta from API if available, otherwise calculate or use empty string for missing data
			const w1Delta = w1DeltaData !== undefined ? w1DeltaData : w1Data === undefined ? '' : w1Value;
			const w2Delta =
				w2DeltaData !== undefined ? w2DeltaData : w2Data === undefined ? '' : w2Value - w1Value;
			const w3Delta =
				w3DeltaData !== undefined ? w3DeltaData : w3Data === undefined ? '' : w3Value - w2Value;
			const w4Delta =
				w4DeltaData !== undefined ? w4DeltaData : w4Data === undefined ? '' : w4Value - w3Value;

			return {
				slNo: index + 1,
				clientName,
				w1: w1Value,
				w1Delta,
				w2: w2Value,
				w2Delta,
				w3: w3Value,
				w3Delta,
				w4: w4Value,
				w4Delta,
			};
		});

		// Calculate totals
		const totalW1 = Object.values(week1 || {}).reduce((sum: number, val) => {
			const count =
				typeof val === 'object' && val !== null && !Array.isArray(val)
					? (val as { count?: number }).count || 0
					: typeof val === 'number'
						? val
						: 0;
			return sum + count;
		}, 0);
		const totalW2 = Object.values(week2 || {}).reduce((sum: number, val) => {
			const count =
				typeof val === 'object' && val !== null && !Array.isArray(val)
					? (val as { count?: number }).count || 0
					: typeof val === 'number'
						? val
						: 0;
			return sum + count;
		}, 0);
		const totalW3 = Object.values(week3 || {}).reduce((sum: number, val) => {
			const count =
				typeof val === 'object' && val !== null && !Array.isArray(val)
					? (val as { count?: number }).count || 0
					: typeof val === 'number'
						? val
						: 0;
			return sum + count;
		}, 0);
		const totalW4 = Object.values(week4 || {}).reduce((sum: number, val) => {
			const count =
				typeof val === 'object' && val !== null && !Array.isArray(val)
					? (val as { count?: number }).count || 0
					: typeof val === 'number'
						? val
						: 0;
			return sum + count;
		}, 0);

		const totalRow = {
			slNo: '-',
			clientName: 'Total',
			w1: totalW1,
			w1Delta: '',
			w2: totalW2,
			w2Delta: '',
			w3: totalW3,
			w3Delta: '',
			w4: totalW4,
			w4Delta: '',
			isTotal: true,
		};

		const result = [...clientRows, totalRow];
		return result;
	}, [data]);

	// Transform escalation category data
	const escalationCategoryData = React.useMemo(() => {
		if (!data?.totalEscalationWeekWise) return [];

		const { week1, week2, week3, week4 } = data.totalEscalationWeekWise;
		const allCategories = new Set<string>();

		// Collect all unique category names (excluding 'delta')
		[week1, week2, week3, week4].forEach(week => {
			Object.keys(week || {}).forEach(key => {
				if (key !== 'delta') {
					allCategories.add(key);
				}
			});
		});

		// Create rows for each category
		const categoryRows: Array<{
			slNo: number;
			category: string;
			w1: number;
			w2: number;
			w3: number;
			w4: number;
			isTotal?: boolean;
			isDelta?: boolean;
		}> = Array.from(allCategories).map((category, index) => {
			// Extract values from each week (category names are keys, values are numbers)
			const w1Value = ((week1 as unknown as Record<string, unknown>)?.[category] as number) || 0;
			const w2Value = ((week2 as unknown as Record<string, unknown>)?.[category] as number) || 0;
			const w3Value = ((week3 as unknown as Record<string, unknown>)?.[category] as number) || 0;
			const w4Value = ((week4 as unknown as Record<string, unknown>)?.[category] as number) || 0;

			return {
				slNo: index + 1,
				category,
				w1: w1Value,
				w2: w2Value,
				w3: w3Value,
				w4: w4Value,
			};
		});

		// Calculate totals
		const totalW1 = categoryRows.reduce((sum, row) => sum + row.w1, 0);
		const totalW2 = categoryRows.reduce((sum, row) => sum + row.w2, 0);
		const totalW3 = categoryRows.reduce((sum, row) => sum + row.w3, 0);
		const totalW4 = categoryRows.reduce((sum, row) => sum + row.w4, 0);

		const totalRow = {
			slNo: '-',
			category: 'Total',
			w1: totalW1,
			w2: totalW2,
			w3: totalW3,
			w4: totalW4,
			isTotal: true,
		};

		const deltaRow = {
			slNo: '-',
			category: 'Delta',
			w1: 0, // Will be formatted as '-'
			w2: 0, // Will be formatted as '-'
			w3: 0, // Will be formatted as '-'
			w4: 0, // Will be formatted as '-'
			isDelta: true,
		};

		const result = [...categoryRows, totalRow, deltaRow];
		return result;
	}, [data]);

	if (isLoading) {
		return (
			<div className='p-6 text-center'>
				<p className='text-gray-600'>Loading escalations data...</p>
			</div>
		);
	}

	return (
		<div className='p-6 space-y-8'>
			{/* Client Escalation Table */}
			<div>
				<h3 className='text-lg font-semibold text-gray-900 mb-4'>Client Escalation Table</h3>
				<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse'>
							<thead>
								<tr className='bg-gray-50 border-b border-gray-200'>
									<th className='px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap'>
										SL. NO.
									</th>
									<th className='px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap'>
										Client Name
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w1')}`}
									>
										W1
									</th>
									<th className='px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap bg-gray-100'>
										Delta
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w2')}`}
									>
										W2
									</th>
									<th className='px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap bg-gray-100'>
										Delta
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w3')}`}
									>
										W3
									</th>
									<th className='px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap bg-gray-100'>
										Delta
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w4')}`}
									>
										W4
									</th>
									<th className='px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap bg-gray-100'>
										Delta
									</th>
								</tr>
							</thead>
							<tbody>
								{clientEscalationData.length === 0 ? (
									<tr>
										<td colSpan={10} className='px-4 py-8 text-center text-gray-500'>
											No escalation data available
										</td>
									</tr>
								) : (
									clientEscalationData.map((row, index) => (
										<tr
											key={index}
											className={`border-b border-gray-200 ${
												row.isTotal ? 'bg-gray-50 font-semibold' : ''
											}`}
										>
											<td className='px-4 py-3 text-sm text-gray-900'>{row.slNo}</td>
											<td className='px-4 py-3 text-sm text-gray-900'>{row.clientName}</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w1')}`}
											>
												{formatEscalationValue(
													row.w1 as number | string | null | undefined,
													row.isTotal
												)}
											</td>
											<td className='px-4 py-3 text-sm text-gray-900 text-right bg-gray-100'>
												{formatEscalationValue(
													row.w1Delta === ''
														? null
														: (row.w1Delta as number | string | null | undefined)
												)}
											</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w2')}`}
											>
												{formatEscalationValue(
													row.w2 as number | string | null | undefined,
													row.isTotal
												)}
											</td>
											<td className='px-4 py-3 text-sm text-gray-900 text-right bg-gray-100'>
												{formatEscalationValue(
													row.w2Delta === ''
														? null
														: (row.w2Delta as number | string | null | undefined)
												)}
											</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w3')}`}
											>
												{formatEscalationValue(
													row.w3 as number | string | null | undefined,
													row.isTotal
												)}
											</td>
											<td className='px-4 py-3 text-sm text-gray-900 text-right bg-gray-100'>
												{formatEscalationValue(
													row.w3Delta === ''
														? null
														: (row.w3Delta as number | string | null | undefined)
												)}
											</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w4')}`}
											>
												{formatEscalationValue(
													row.w4 as number | string | null | undefined,
													row.isTotal
												)}
											</td>
											<td className='px-4 py-3 text-sm text-gray-900 text-right bg-gray-100'>
												{formatEscalationValue(
													row.w4Delta === ''
														? null
														: (row.w4Delta as number | string | null | undefined)
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Escalation Category Table */}
			<div>
				<h3 className='text-lg font-semibold text-gray-900 mb-4'>
					Escalation Category (Max Escalation per week)
				</h3>
				<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='w-full border-collapse'>
							<thead>
								<tr className='bg-gray-50 border-b border-gray-200'>
									<th className='px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap'>
										SL. NO.
									</th>
									<th className='px-4 py-3 text-left text-sm font-medium text-gray-700 whitespace-nowrap'>
										Escalation Category
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w1')}`}
									>
										W1
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w2')}`}
									>
										W2
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w3')}`}
									>
										W3
									</th>
									<th
										className={`px-4 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap ${getWeekBgColor('w4')}`}
									>
										W4
									</th>
								</tr>
							</thead>
							<tbody>
								{escalationCategoryData.length === 0 ? (
									<tr>
										<td colSpan={6} className='px-4 py-8 text-center text-gray-500'>
											No escalation category data available
										</td>
									</tr>
								) : (
									escalationCategoryData.map((row, index) => (
										<tr
											key={index}
											className={`border-b border-gray-200 ${
												'isTotal' in row && row.isTotal
													? 'bg-gray-50 font-semibold'
													: 'isDelta' in row && row.isDelta
														? 'bg-gray-100 font-semibold'
														: ''
											}`}
										>
											<td className='px-4 py-3 text-sm text-gray-900'>{row.slNo}</td>
											<td className='px-4 py-3 text-sm text-gray-900'>{row.category}</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w1')}`}
											>
												{formatEscalationValue(row.w1, 'isTotal' in row && row.isTotal === true)}
											</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w2')}`}
											>
												{formatEscalationValue(row.w2, 'isTotal' in row && row.isTotal === true)}
											</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w3')}`}
											>
												{formatEscalationValue(row.w3, 'isTotal' in row && row.isTotal === true)}
											</td>
											<td
												className={`px-4 py-3 text-sm text-gray-900 text-right ${getWeekBgColor('w4')}`}
											>
												{formatEscalationValue(row.w4, 'isTotal' in row && row.isTotal === true)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};
