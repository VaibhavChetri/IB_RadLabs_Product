import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Snackbar } from '../../../components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import {
	setBudget,
	setBudgets,
	setOnSiteManPowerEstimate,
	setOnSiteManPowerEstimates,
	setLastUpdated,
} from '../../../store/slices/revenueSlice';
import { RevenueAddFilters } from '../../../features/revenue/components/RevenueAddFilters';
import { useRevenueFilters } from '../../../features/revenue/hooks/useRevenueFilters';
import { useReviewCostingTypes } from '../../../features/revenue/hooks/useReviewCostingTypes';
import { useProjectedCosting } from '../../../features/revenue/hooks/useProjectedCosting';
import { useOnSiteManPowerClients } from '../../../features/revenue/hooks/useOnSiteManPowerClients';
import { CostingBudgetTable } from '../../../features/revenue/components/CostingBudgetTable';
import { OnSiteManPowerTable } from '../../../features/revenue/components/OnSiteManPowerTable';
import {
	GetProjectedCostingParams,
	ProjectedActualCostingService,
	AddProjectedActualCostingRequest,
} from '../../../services/pAndLApi';
import { Button } from '../../../components/ui';
import { Save } from 'lucide-react';

/**
 * Helper to format date_year parameter (YYYY-MM-01 format)
 */
const getDateYearFromMonthYear = (month: string, year: string): string => {
	const monthNum = parseInt(month, 10);
	const yearNum = parseInt(year, 10);
	// Use UTC to avoid timezone conversion issues
	const date = new Date(Date.UTC(yearNum, monthNum - 1, 1));
	const formattedYear = date.getUTCFullYear();
	const formattedMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
	return `${formattedYear}-${formattedMonth}-01`;
};

/**
 * Monthly Estimate Add Page
 * Add new monthly revenue estimates
 */
export const MonthlyEstimateAdd: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const {
		budgets: persistedBudgets,
		onSiteManPowerEstimates: persistedEstimates,
		lastUpdated,
	} = useSelector((state: RootState) => state.revenue);

	const {
		selectedMonth,
		selectedYear,
		selectedFacility,
		monthOptions,
		yearOptions,
		setSelectedMonth,
		setSelectedYear,
		setSelectedFacility,
	} = useRevenueFilters();

	const {
		data: costingTypes,
		isLoading: isLoadingCostingTypes,
		error: costingTypesError,
	} = useReviewCostingTypes();

	// Use Redux state instead of local state
	const [budgets, setBudgetsLocal] = useState<Record<number, string>>(persistedBudgets);
	const [onSiteManPowerEstimates, setOnSiteManPowerEstimatesLocal] =
		useState<Record<number, string>>(persistedEstimates);

	// Get facility ID
	const facilityId = useMemo(() => {
		if (!selectedFacility) return null;
		const id = parseInt(selectedFacility, 10);
		return isNaN(id) ? null : id;
	}, [selectedFacility]);

	// Prepare API params for projected costing
	const projectedCostingParams: GetProjectedCostingParams | null = useMemo(() => {
		if (!selectedMonth || !selectedYear || !facilityId) return null;
		return {
			date_year: getDateYearFromMonthYear(selectedMonth, selectedYear),
			facility_id: facilityId,
		};
	}, [selectedMonth, selectedYear, facilityId]);

	// Check if we should load from API or use persisted data
	const shouldLoadFromAPI = useMemo(() => {
		if (!projectedCostingParams) return false;
		// Load from API if filters changed (different month/year/facility)
		return (
			!lastUpdated.date_year ||
			!lastUpdated.facility_id ||
			lastUpdated.date_year !== projectedCostingParams.date_year ||
			lastUpdated.facility_id !== projectedCostingParams.facility_id
		);
	}, [projectedCostingParams, lastUpdated]);

	// Fetch projected costing data
	const {
		data: projectedCostingData,
		manPowerResults,
		isLoading: isLoadingProjectedCosting,
		error: projectedCostingError,
	} = useProjectedCosting(projectedCostingParams, !!projectedCostingParams);

	// Fetch on-site manpower clients

	const {
		data: onSiteManPowerClients,
		isLoading: isLoadingOnSiteClients,
		error: onSiteClientsError,
	} = useOnSiteManPowerClients(facilityId, !!facilityId);

	// Sync local state with Redux persisted state
	useEffect(() => {
		setBudgetsLocal(persistedBudgets);
	}, [persistedBudgets]);

	useEffect(() => {
		setOnSiteManPowerEstimatesLocal(persistedEstimates);
	}, [persistedEstimates]);

	// Load persisted data on mount or when filters match persisted data
	useEffect(() => {
		if (!shouldLoadFromAPI && projectedCostingParams) {
			// Use persisted data if filters match - already synced above
		}
	}, [shouldLoadFromAPI, projectedCostingParams]);

	// Populate budgets from API response (only if filters changed)
	useEffect(() => {
		if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

		if (projectedCostingData && projectedCostingData.length > 0) {
			const budgetsMap: Record<number, string> = {};
			projectedCostingData.forEach(item => {
				// Use costing_type_id as key and projected_value as value
				const value = parseFloat(item.projected_value);
				budgetsMap[item.costing_type_id] = value.toString();
			});
			setBudgetsLocal(budgetsMap);
			dispatch(setBudgets(budgetsMap));
			if (projectedCostingParams) {
				dispatch(
					setLastUpdated({
						date_year: projectedCostingParams.date_year,
						facility_id: projectedCostingParams.facility_id,
					})
				);
			}
		} else if (projectedCostingData && projectedCostingData.length === 0) {
			// Empty array - reset budgets to empty
			setBudgetsLocal({});
			dispatch(setBudgets({}));
		}
	}, [projectedCostingData, shouldLoadFromAPI, dispatch, projectedCostingParams]);

	// Populate on-site manpower estimates from API response (only if filters changed)
	useEffect(() => {
		if (!shouldLoadFromAPI) return; // Don't overwrite if using persisted data

		if (manPowerResults && manPowerResults.length > 0) {
			const estimatesMap: Record<number, string> = {};
			manPowerResults.forEach(item => {
				const value = parseFloat(item.est);
				estimatesMap[item.client_id] = value.toString();
			});
			setOnSiteManPowerEstimatesLocal(estimatesMap);
			dispatch(setOnSiteManPowerEstimates(estimatesMap));
		} else if (manPowerResults && manPowerResults.length === 0) {
			// Empty array - reset estimates to empty
			setOnSiteManPowerEstimatesLocal({});
			dispatch(setOnSiteManPowerEstimates({}));
		}
	}, [manPowerResults, shouldLoadFromAPI, dispatch]);

	const handleOnSiteManPowerEstimateChange = (clientId: number, value: string) => {
		const updatedEstimates = {
			...onSiteManPowerEstimates,
			[clientId]: value,
		};
		setOnSiteManPowerEstimatesLocal(updatedEstimates);
		dispatch(setOnSiteManPowerEstimate({ clientId, value }));
	};

	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'error' as 'success' | 'error' | 'info',
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSearch = () => {
		// TODO: Implement search/filter logic for Add page
		console.log('Search clicked with filters:', {
			month: selectedMonth,
			year: selectedYear,
			facility: selectedFacility,
		});
	};

	const handleSubmit = async () => {
		if (!projectedCostingParams || !facilityId) {
			setSnackbar({
				open: true,
				message: 'Please select month, year, and facility before submitting.',
				type: 'error',
			});
			return;
		}

		setIsSubmitting(true);

		try {
			// Transform budgets into projectedValues array - include all costing types, even if zero
			const projectedValues =
				costingTypes?.map(costingType => {
					const budgetValue = budgets[costingType.id] || '0';
					return {
						costing_type_id: costingType.id,
						projected_value: parseFloat(budgetValue) || 0,
					};
				}) || [];

			// Transform on-site manpower estimates into onSiteManPower_clients array - include all clients, even if zero
			const onSiteManPowerClientsPayload =
				onSiteManPowerClients?.map(client => {
					const estimateValue = onSiteManPowerEstimates[client.client_id] || '0';
					return {
						client_id: client.client_id,
						value: parseFloat(estimateValue) || 0,
					};
				}) || [];

			const payload: AddProjectedActualCostingRequest = {
				projectedValues,
				date_year: projectedCostingParams.date_year,
				facility_id: facilityId,
				onSiteManPower_clients: onSiteManPowerClientsPayload,
			};

			const response = await ProjectedActualCostingService.addProjectedActualCosting(payload);

			if (response.status_code === 200 || response.status === 'Success') {
				setSnackbar({
					open: true,
					message: 'Budget and estimates saved successfully!',
					type: 'success',
				});
				// Update lastUpdated to prevent reloading from API
				dispatch(
					setLastUpdated({
						date_year: projectedCostingParams.date_year,
						facility_id: facilityId,
					})
				);
				// Navigate to listing page after a short delay to show success message
				setTimeout(() => {
					navigate('/revenue/monthly-estimate/list');
				}, 1500);
			} else {
				throw new Error(response.message || 'Failed to save data');
			}
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to save budget and estimates. Please try again.',
				type: 'error',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBudgetChange = (costingTypeId: number, value: string) => {
		const updatedBudgets = {
			...budgets,
			[costingTypeId]: value,
		};
		setBudgetsLocal(updatedBudgets);
		dispatch(setBudget({ costingTypeId, value }));
	};

	// Show error if costing types or projected costing fail to load
	useEffect(() => {
		if (costingTypesError) {
			setSnackbar({
				open: true,
				message: 'Failed to load costing types. Please try again.',
				type: 'error',
			});
		}
	}, [costingTypesError]);

	useEffect(() => {
		if (projectedCostingError) {
			setSnackbar({
				open: true,
				message: 'Failed to load projected costing data. Please try again.',
				type: 'error',
			});
		}
	}, [projectedCostingError]);

	useEffect(() => {
		if (onSiteClientsError) {
			setSnackbar({
				open: true,
				message: 'Failed to load on-site manpower clients. Please try again.',
				type: 'error',
			});
		}
	}, [onSiteClientsError]);

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Add Monthly Estimate'
				locationName={user?.city_name || 'City'}
				totalItems={0}
				itemType='estimate'
				icon='💰'
			/>
			<RevenueAddFilters
				selectedMonth={selectedMonth}
				selectedYear={selectedYear}
				selectedFacility={selectedFacility}
				monthOptions={monthOptions}
				yearOptions={yearOptions}
				onMonthChange={setSelectedMonth}
				onYearChange={setSelectedYear}
				onFacilityChange={setSelectedFacility}
				onSearch={handleSearch}
			/>
			{costingTypes && costingTypes.length > 0 && (
				<CostingBudgetTable
					costingTypes={costingTypes}
					budgets={budgets}
					onBudgetChange={handleBudgetChange}
					isLoading={isLoadingCostingTypes || isLoadingProjectedCosting}
				/>
			)}
			{onSiteManPowerClients && onSiteManPowerClients.length > 0 && (
				<OnSiteManPowerTable
					clients={onSiteManPowerClients}
					estimates={onSiteManPowerEstimates}
					onEstimateChange={handleOnSiteManPowerEstimateChange}
					manPowerResults={manPowerResults}
					isLoading={isLoadingOnSiteClients || isLoadingProjectedCosting}
				/>
			)}
			{/* Submit Button */}
			<div className='flex justify-end'>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || !projectedCostingParams || !facilityId}
					className='flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
				>
					<Save className='h-4 w-4' />
					<span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
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

export default MonthlyEstimateAdd;
