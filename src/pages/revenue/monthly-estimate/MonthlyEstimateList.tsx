import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Table, Snackbar } from '../../../components/ui';
import { TableColumn } from '../../../components/ui/DataDisplay';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { RevenueFilters, useRevenueFilters } from '../../../features/revenue';
import { useRevenueListingData } from '../../../features/revenue/hooks/useRevenueListingData';
import { canFilterByCity } from '../../../utils/cityFilterPermissions';
import { Pencil } from 'lucide-react';

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
 * Get total column background color (neutral gray to distinguish from weekly data)
 */
const getTotalBgColor = (): string => {
	return 'bg-gray-100';
};

/**
 * Format number with commas or return dash for zero/null
 */
const formatRevenueValue = (
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
 * Monthly Estimate List Page
 * List all monthly revenue estimates
 */
export const MonthlyEstimateList: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		selectedMonth,
		selectedYear,
		selectedCity,
		selectedFacility,
		selectedCostCategory,
		monthOptions,
		yearOptions,
		cityOptions,
		facilityOptions,
		costCategoryOptions,
		setSelectedMonth,
		setSelectedYear,
		setSelectedCity,
		setSelectedFacility,
		setSelectedCostCategory,
	} = useRevenueFilters();

	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'error' as 'success' | 'error' | 'info',
	});

	// Determine if we should fetch - cost category is optional (can be empty to show all)
	// For users with the city-filter capability, city must also be selected.
	const shouldFetch = !!(
		selectedMonth &&
		selectedYear &&
		selectedFacility &&
		(!canFilterByCity(user?.userTypeId) || selectedCity)
	);

	// Determine city_id to use - selected city for users with the city-filter capability,
	// otherwise the user's own assigned city.
	const cityId = canFilterByCity(user?.userTypeId)
		? (selectedCity ? parseInt(selectedCity) : undefined)
		: user?.city_id;

	console.log('MonthlyEstimateList - Filter values:', {
		selectedMonth,
		selectedYear,
		selectedCity,
		selectedFacility,
		selectedCostCategory,
		cityId,
		shouldFetch,
	});

	// Call revenue listing API
	// costCategoryId is optional - pass undefined if empty to show all data
	const { data, isLoading, error } = useRevenueListingData(
		cityId,
		selectedFacility,
		selectedMonth,
		selectedYear,
		selectedCostCategory || undefined, // Pass undefined if empty string
		shouldFetch
	);

	// Handle API errors
	React.useEffect(() => {
		if (error && shouldFetch) {
			setSnackbar({
				open: true,
				message: `Failed to load revenue data: ${error.message}`,
				type: 'error',
			});
		}
	}, [error, shouldFetch]);

	const handleSearch = () => {
		// API is called automatically when filters change
		// This is kept for UI consistency
	};

	const handleEdit = React.useCallback(
		(recordId: number) => {
			// Use selectedFacility from the dropdown filter
			const facilityId = selectedFacility;

			if (!facilityId) {
				console.error('handleEdit - No facility ID found:', {
					recordId,
					selectedFacility,
					selectedMonth,
					selectedYear,
				});
				setSnackbar({
					open: true,
					message: 'Please select a facility from the dropdown filter first.',
					type: 'error',
				});
				return;
			}

			if (!selectedMonth || !selectedYear) {
				console.error('handleEdit - Missing month or year:', {
					selectedMonth,
					selectedYear,
				});
				setSnackbar({
					open: true,
					message: 'Please select month and year from the filters first.',
					type: 'error',
				});
				return;
			}

			// Navigate to edit page with query params
			const params = new URLSearchParams({
				month: selectedMonth,
				year: selectedYear,
				facility_id: facilityId,
			});
			console.log('handleEdit - Navigating with params:', {
				month: selectedMonth,
				year: selectedYear,
				facility_id: facilityId,
				url: `/revenue/monthly-estimate/edit?${params.toString()}`,
			});
			navigate(`/revenue/monthly-estimate/edit?${params.toString()}`);
		},
		[selectedFacility, selectedMonth, selectedYear, navigate, setSnackbar]
	);

	// Define table columns
	const columns: TableColumn<Record<string, unknown>>[] = useMemo(
		() => [
			{
				key: 'actions',
				title: 'Actions',
				align: 'center',
				width: '80px',
				sortable: false,
				render: (_value: unknown, record: Record<string, unknown>) => (
					<button
						onClick={() => handleEdit(record.id as number)}
						className='text-green-600 hover:text-green-700 p-1 rounded transition-colors'
						title='Edit'
					>
						<Pencil className='h-4 w-4' />
					</button>
				),
			},
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
				render: (_value: unknown, record: Record<string, unknown>) =>
					formatRevenueValue(record.projected_value as number | string | null | undefined),
			},
			{
				key: 'week1_actual_value',
				title: 'W1',
				align: 'right',
				sortable: true,
				headerClassName: getWeekBgColor('w1'),
				render: (_value: unknown, record: Record<string, unknown>) => (
					<span className={getWeekBgColor('w1') + ' px-2 py-1 rounded block text-right'}>
						{formatRevenueValue(record.week1_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week1_delta_with_percentage',
				title: 'Delta(W1)',
				align: 'right',
				sortable: true,
				headerClassName: getWeekBgColor('w1'),
				render: (_value: unknown, record: Record<string, unknown>) => (
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
				headerClassName: getWeekBgColor('w2'),
				render: (_value, record) => (
					<span className={getWeekBgColor('w2') + ' px-2 py-1 rounded block text-right'}>
						{formatRevenueValue(record.week2_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week2_delta_with_percentage',
				title: 'Delta(W2)',
				align: 'right',
				sortable: true,
				headerClassName: getWeekBgColor('w2'),
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
				headerClassName: getWeekBgColor('w3'),
				render: (_value, record) => (
					<span className={getWeekBgColor('w3') + ' px-2 py-1 rounded block text-right'}>
						{formatRevenueValue(record.week3_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week3_delta_with_percentage',
				title: 'Delta(W3)',
				align: 'right',
				sortable: true,
				headerClassName: getWeekBgColor('w3'),
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
				headerClassName: getWeekBgColor('w4'),
				render: (_value, record) => (
					<span className={getWeekBgColor('w4') + ' px-2 py-1 rounded block text-right'}>
						{formatRevenueValue(record.week4_actual_value as number | string | null | undefined)}
					</span>
				),
			},
			{
				key: 'week4_delta_with_percentage',
				title: 'Delta(W4)',
				align: 'right',
				sortable: true,
				headerClassName: getWeekBgColor('w4'),
				render: (_value, record) => (
					<span className={getDeltaBgColor('w4') + ' px-2 py-1 rounded block text-right'}>
						{(record.week4_delta_with_percentage as string) || '-'}
					</span>
				),
			},
			{
				key: 'total_actual_value',
				title: 'Σ Actual',
				align: 'right',
				sortable: true,
				headerClassName: getTotalBgColor(),
				render: (_value: unknown, record: Record<string, unknown>) =>
					formatRevenueValue(record.total_actual_value as number | string | null | undefined, true),
			},
			{
				key: 'total_delta_with_percentage',
				title: 'Σ Delta',
				align: 'right',
				sortable: true,
				headerClassName: getTotalBgColor(),
				render: (_value: unknown, record: Record<string, unknown>) =>
					(record.total_delta_with_percentage as string) || '-',
			},
		],
		[handleEdit]
	);

	// Transform data for table
	const tableData = useMemo(() => {
		if (!data?.data || !Array.isArray(data.data) || data.data.length === 0) return [];

		// Extract records from nested structure: data[0].facilities[0].monthYearData[0].records
		const cityData = data.data[0];
		if (!cityData?.facilities || cityData.facilities.length === 0) return [];

		const facilityData = cityData.facilities[0];
		if (!facilityData?.monthYearData || facilityData.monthYearData.length === 0) return [];

		const monthYearData = facilityData.monthYearData[0];
		const records = monthYearData.records || [];

		if (records.length === 0) return [];

		// Define interface for revenue record
		interface RevenueRecord {
			id: number;
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
		const rows: Array<Record<string, unknown>> = (records as RevenueRecord[]).map(
			(record: RevenueRecord, index: number) => ({
				id: record.id,
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

		return rows;
	}, [data]);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Monthly Estimate List'
				locationName={user?.city_name || 'City'}
				totalItems={tableData.length}
				itemType='estimates'
				icon='📊'
			/>

			<RevenueFilters
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				selectedCity={selectedCity}
				selectedFacility={selectedFacility}
				selectedCostCategory={selectedCostCategory}
				monthOptions={monthOptions}
				yearOptions={yearOptions}
				cityOptions={cityOptions}
				facilityOptions={facilityOptions}
				costCategoryOptions={costCategoryOptions}
				onMonthChange={setSelectedMonth}
				onYearChange={setSelectedYear}
				onCityChange={setSelectedCity}
				onFacilityChange={setSelectedFacility}
				onCostCategoryChange={setSelectedCostCategory}
				onSearch={handleSearch}
			/>

			<div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<Table
					columns={columns}
					data={tableData}
					loading={isLoading}
					emptyText='No revenue data available'
					size='sm'
				/>
			</div>

			<Snackbar
				open={snackbar.open}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				message={snackbar.message}
				type={snackbar.type}
			/>
		</div>
	);
};

export default MonthlyEstimateList;
