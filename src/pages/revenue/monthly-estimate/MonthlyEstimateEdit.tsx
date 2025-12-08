import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader, Snackbar, Button } from '../../../components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import {
	setEditBudgetWeekValues,
	setEditManPowerWeekValues,
	setEditLastUpdated,
	clearEditRevenueData,
} from '../../../store/slices/revenueSlice';
import { useRevenueListingData } from '../../../features/revenue/hooks/useRevenueListingData';
import { EditableBudgetTable } from '../../../features/revenue/components/EditableBudgetTable';
import { EditableOnSiteManPowerTable } from '../../../features/revenue/components/EditableOnSiteManPowerTable';
import {
	OnSiteManPowerItem,
	PAndLApiService,
	UpdateRevenueRequest,
} from '../../../services/pAndLApi';
import { Save } from 'lucide-react';

/**
 * Extended OnSiteManPowerItem with week fields
 */
interface ExtendedOnSiteManPowerItem extends OnSiteManPowerItem {
	week1?: string | number | null;
	week2?: string | number | null;
	week3?: string | number | null;
	week4?: string | number | null;
}

/**
 * Monthly Estimate Edit Page
 * Edit monthly revenue estimates with weekly actuals
 */
export const MonthlyEstimateEdit: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		editBudgetWeekValues: persistedBudgetWeekValues,
		editManPowerWeekValues: persistedManPowerWeekValues,
	} = useSelector((state: RootState) => state.revenue);

	// Get parameters from URL
	const month = searchParams.get('month') || '';
	const year = searchParams.get('year') || '';
	const facilityId = searchParams.get('facility_id') || '';
	const cityId = user?.city_id;

	// Debug logging
	React.useEffect(() => {
		console.log('MonthlyEstimateEdit - URL params:', {
			month,
			year,
			facilityId,
			cityId,
			allParamsPresent: !!(month && year && facilityId && cityId),
		});
	}, [month, year, facilityId, cityId]);

	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'error' as 'success' | 'error' | 'info',
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	// Use Redux state instead of local state
	const [budgetWeekValues, setBudgetWeekValuesLocal] = useState<
		Record<number, { week1: string; week2: string; week3: string; week4: string }>
	>(persistedBudgetWeekValues);
	const [manPowerWeekValues, setManPowerWeekValuesLocal] = useState<
		Record<number, { week1: string; week2: string; week3: string; week4: string }>
	>(persistedManPowerWeekValues);

	// Always load from API on edit page - don't use persisted data
	// This ensures we always have the latest data from the server
	const shouldLoadFromAPI = true;

	// Determine if we should fetch
	const shouldFetch = !!(month && year && facilityId && cityId);

	// Debug: Log shouldFetch calculation
	React.useEffect(() => {
		console.log('MonthlyEstimateEdit - shouldFetch calculation:', {
			month: month || 'EMPTY',
			year: year || 'EMPTY',
			facilityId: facilityId || 'EMPTY',
			cityId: cityId || 'EMPTY',
			shouldFetch,
		});
	}, [month, year, facilityId, cityId, shouldFetch]);

	// Fetch revenue data
	const { data, isLoading, error } = useRevenueListingData(
		cityId,
		facilityId,
		month,
		year,
		undefined, // No cost category filter for edit
		shouldFetch
	);

	// Debug: Log query state
	React.useEffect(() => {
		console.log('MonthlyEstimateEdit - Query state:', {
			isLoading,
			hasData: !!data,
			error: error?.message,
		});
	}, [isLoading, data, error]);

	// Extract records and onSiteManPowerDetails from API response
	const { records, onSiteManPowerDetails } = useMemo(() => {
		if (!data?.data || data.data.length === 0) {
			return { records: [], onSiteManPowerDetails: [] };
		}

		const cityData = data.data[0];
		if (!cityData.facilities || cityData.facilities.length === 0) {
			return { records: [], onSiteManPowerDetails: [] };
		}

		const facilityData = cityData.facilities[0];
		if (!facilityData.monthYearData || facilityData.monthYearData.length === 0) {
			return { records: [], onSiteManPowerDetails: [] };
		}

		const monthYearData = facilityData.monthYearData[0];
		return {
			records: monthYearData.records || [],
			onSiteManPowerDetails: monthYearData.onSiteManPowerDetails || [],
		};
	}, [data]);

	// Sync local state with Redux persisted state
	useEffect(() => {
		setBudgetWeekValuesLocal(persistedBudgetWeekValues);
	}, [persistedBudgetWeekValues]);

	useEffect(() => {
		setManPowerWeekValuesLocal(persistedManPowerWeekValues);
	}, [persistedManPowerWeekValues]);

	// Initialize state from API data (only if filters changed)
	useEffect(() => {
		if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

		if (records.length > 0) {
			const initialBudgetValues: Record<
				number,
				{ week1: string; week2: string; week3: string; week4: string }
			> = {};
			records.forEach(record => {
				initialBudgetValues[record.id] = {
					week1: record.week1_actual_value || '0',
					week2: record.week2_actual_value || '0',
					week3: record.week3_actual_value || '0',
					week4: record.week4_actual_value || '0',
				};
			});
			setBudgetWeekValuesLocal(initialBudgetValues);
			dispatch(setEditBudgetWeekValues(initialBudgetValues));
			if (month && year && facilityId) {
				dispatch(
					setEditLastUpdated({
						month,
						year,
						facility_id: facilityId,
					})
				);
			}
		}
	}, [records, shouldLoadFromAPI, dispatch, month, year, facilityId]);

	useEffect(() => {
		if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

		if (onSiteManPowerDetails.length > 0) {
			const initialManPowerValues: Record<
				number,
				{ week1: string; week2: string; week3: string; week4: string }
			> = {};
			onSiteManPowerDetails.forEach((item: ExtendedOnSiteManPowerItem) => {
				// Handle null values properly - convert null to '0', otherwise convert to string
				const formatWeekValue = (value: string | number | null | undefined): string => {
					if (value === null || value === undefined) return '0';
					return String(value);
				};
				initialManPowerValues[item.client_id] = {
					week1: formatWeekValue(item.week1),
					week2: formatWeekValue(item.week2),
					week3: formatWeekValue(item.week3),
					week4: formatWeekValue(item.week4),
				};
			});
			setManPowerWeekValuesLocal(initialManPowerValues);
			dispatch(setEditManPowerWeekValues(initialManPowerValues));
		}
	}, [onSiteManPowerDetails, shouldLoadFromAPI, dispatch]);

	// Handle API errors
	useEffect(() => {
		if (error) {
			setSnackbar({
				open: true,
				message: `Failed to load revenue data: ${error.message}`,
				type: 'error',
			});
		}
	}, [error]);

	// Handlers for budget week changes
	const handleBudgetWeekChange = (
		recordId: number,
		week: 'week1' | 'week2' | 'week3' | 'week4',
		value: string
	) => {
		const updatedValues = {
			...budgetWeekValues,
			[recordId]: {
				...budgetWeekValues[recordId],
				[week]: value,
			},
		};
		setBudgetWeekValuesLocal(updatedValues);
		dispatch(setEditBudgetWeekValues(updatedValues));
	};

	// Handlers for on-site manpower week changes
	const handleManPowerWeekChange = (
		clientId: number,
		week: 'week1' | 'week2' | 'week3' | 'week4',
		value: string
	) => {
		const updatedValues = {
			...manPowerWeekValues,
			[clientId]: {
				...manPowerWeekValues[clientId],
				[week]: value,
			},
		};
		setManPowerWeekValuesLocal(updatedValues);
		dispatch(setEditManPowerWeekValues(updatedValues));
	};

	// Prepare records with updated week values for display
	const recordsWithUpdatedValues = useMemo(() => {
		return records.map(record => ({
			...record,
			week1_actual_value: budgetWeekValues[record.id]?.week1 || record.week1_actual_value || '0',
			week2_actual_value: budgetWeekValues[record.id]?.week2 || record.week2_actual_value || '0',
			week3_actual_value: budgetWeekValues[record.id]?.week3 || record.week3_actual_value || '0',
			week4_actual_value: budgetWeekValues[record.id]?.week4 || record.week4_actual_value || '0',
		}));
	}, [records, budgetWeekValues]);

	// Prepare on-site manpower details with updated week values for display
	const manPowerDetailsWithUpdatedValues = useMemo(() => {
		return onSiteManPowerDetails.map((item: ExtendedOnSiteManPowerItem) => ({
			...item,
			week1: manPowerWeekValues[item.client_id]?.week1 || item.week1 || '0',
			week2: manPowerWeekValues[item.client_id]?.week2 || item.week2 || '0',
			week3: manPowerWeekValues[item.client_id]?.week3 || item.week3 || '0',
			week4: manPowerWeekValues[item.client_id]?.week4 || item.week4 || '0',
		}));
	}, [onSiteManPowerDetails, manPowerWeekValues]);

	const handleSubmit = async () => {
		if (!month || !year || !facilityId || !cityId) {
			setSnackbar({
				open: true,
				message: 'Missing required parameters',
				type: 'error',
			});
			return;
		}

		setIsSubmitting(true);

		try {
			// Transform budgetWeekValues into weeklyValue array
			const weeklyValue = records.map(record => {
				const weekValues = budgetWeekValues[record.id] || {
					week1: record.week1_actual_value || '0',
					week2: record.week2_actual_value || '0',
					week3: record.week3_actual_value || '0',
					week4: record.week4_actual_value || '0',
				};

				return {
					id: record.id,
					week1_actual_value: parseFloat(weekValues.week1) || 0,
					week2_actual_value: parseFloat(weekValues.week2) || 0,
					week3_actual_value: parseFloat(weekValues.week3) || 0,
					week4_actual_value: parseFloat(weekValues.week4) || 0,
				};
			});

			// Transform manPowerWeekValues into onSiteManPowerDetails array
			const onSiteManPowerDetailsPayload = onSiteManPowerDetails.map((item: ExtendedOnSiteManPowerItem) => {
				const weekValues = manPowerWeekValues[item.client_id] || {
					week1: item.week1 || '0',
					week2: item.week2 || '0',
					week3: item.week3 || '0',
					week4: item.week4 || '0',
				};

				// Get date_year from month/year
				const monthNum = parseInt(month, 10);
				const yearNum = parseInt(year, 10);
				const date = new Date(Date.UTC(yearNum, monthNum - 1, 1));
				const date_year = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;

				// Convert week values to numbers or null (API expects numbers or null, not strings)
				// Empty string or "0" becomes null, otherwise convert to number
				const parseWeekValue = (value: string): number | null => {
					if (!value || value.trim() === '' || value === '0') {
						return null;
					}
					const num = parseFloat(value);
					return isNaN(num) ? null : num;
				};

				return {
					id: item.id,
					client_id: item.client_id,
					costing_type_id: item.costing_type_id,
					est: item.est || '0.00',
					week1: parseWeekValue(weekValues.week1),
					week2: parseWeekValue(weekValues.week2),
					week3: parseWeekValue(weekValues.week3),
					week4: parseWeekValue(weekValues.week4),
					date_year,
					client_name: item.client_name,
				};
			});

			const payload: UpdateRevenueRequest = {
				weeklyValue,
				onSiteManPowerDetails: onSiteManPowerDetailsPayload,
			};

			console.log('handleSubmit - Calling updateRevenue API with payload:', payload);

			const response = await PAndLApiService.updateRevenue(payload);

			if (response.status_code === 200 || response.status === 'Success') {
				setSnackbar({
					open: true,
					message: 'Revenue data updated successfully!',
					type: 'success',
				});
				// Clear persisted edit data after successful submission
				dispatch(clearEditRevenueData());
				// Navigate to listing page after a short delay to show success message
				setTimeout(() => {
					navigate('/revenue/monthly-estimate/list');
				}, 1500);
			} else {
				throw new Error(response.message || 'Failed to update revenue data');
			}
		} catch (error: any) {
			console.error('handleSubmit - Error:', error);
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to update revenue data. Please try again.',
				type: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Show loading if user data is not yet available
	if (!user) {
		return (
			<div className='space-y-6'>
				<PageHeader title='Monthly Actuals' totalItems={0} itemType='revenue entries' />
				<div className='text-center text-gray-500 py-8'>Loading user data...</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className='space-y-6'>
				<PageHeader title='Monthly Actuals' totalItems={0} itemType='revenue entries' />
				<div className='text-center text-gray-500 py-8'>Loading data...</div>
			</div>
		);
	}

	if (!month || !year || !facilityId || !cityId) {
		return (
			<div className='space-y-6'>
				<PageHeader title='Monthly Actuals' totalItems={0} itemType='revenue entries' />
				<div className='text-center text-gray-500 py-8'>
					Missing required parameters. Please navigate from the listing page.
					<br />
					<div className='mt-2 text-xs text-gray-400'>
						Month: {month || 'missing'}, Year: {year || 'missing'}, Facility: {facilityId || 'missing'}, City: {cityId || 'missing'}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<PageHeader title='Edit Monthly Estimate' totalItems={0} itemType='revenue entries' />

			{/* Budget Table */}
			{recordsWithUpdatedValues.length > 0 && (
				<EditableBudgetTable
					records={recordsWithUpdatedValues}
					onWeekChange={handleBudgetWeekChange}
					isLoading={isLoading}
				/>
			)}

			{/* On-Site Manpower Table */}
			{manPowerDetailsWithUpdatedValues.length > 0 && (
				<EditableOnSiteManPowerTable
					manPowerDetails={manPowerDetailsWithUpdatedValues as ExtendedOnSiteManPowerItem[]}
					onWeekChange={handleManPowerWeekChange}
					isLoading={isLoading}
				/>
			)}

			{/* Submit Button */}
			<div className='flex justify-end'>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || recordsWithUpdatedValues.length === 0}
					className='flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
				>
					<Save className='h-4 w-4' />
					<span>{isSubmitting ? 'Submitting...' : 'Submit All'}</span>
				</Button>
			</div>

			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			/>
		</div>
	);
};

