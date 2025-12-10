import React, { useState, useEffect, useCallback } from 'react';
import {
	SearchButton,
	FloatingDropdown,
	Pagination,
	Button,
	PageHeader,
	Snackbar,
} from '../../../components/ui';
import { Table } from '../../../components/ui/DataDisplay';
import { useApi } from '../../../hooks/useApi';
import {
	ClientApiService,
	ClientLocation,
	ClientLocationFilters,
	Client,
} from '../../../services/clientApi';
import { useLocationTypes, useCities } from '../../../hooks/useLocationData';
import { Search, Plus, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setLocations, setSelectedLocation } from '../../../store/slices/clientSlice';

interface PaginationData {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
}

/**
 * Status Toggle Component
 * Toggle switch for enabling/disabling client status
 */
const StatusToggle: React.FC<{
	isActive: boolean;
	onToggle: () => void;
	disabled?: boolean;
}> = ({ isActive, onToggle, disabled = false }) => {
	return (
		<div className='flex items-center justify-center'>
			<button
				onClick={onToggle}
				disabled={disabled}
				className={`
					relative inline-flex h-4 w-8 items-center justify-center rounded-full transition-all duration-200 ease-in-out focus:outline-none
					${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
					${isActive ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'}
				`}
			>
				<span
					className={`
						absolute h-3 w-3 transform rounded-full bg-white transition-all duration-200 ease-in-out
						${isActive ? 'translate-x-2' : '-translate-x-2'}
					`}
				/>
			</button>
			<span className={`ml-2 text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
				{isActive ? 'Active' : 'Inactive'}
			</span>
		</div>
	);
};

export const ManageClients: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);

	// Check if city filter should be shown (only for user_type_id 1,2,3,4)
	const shouldShowCityFilter = user?.userTypeId && [1, 2, 3, 4].includes(user.userTypeId);

	// API hooks
	const { locationTypes, loading: locationTypesLoading } = useLocationTypes();
	const { cities, loading: citiesLoading } = useCities();

	// Client locations API
	const clientLocationsApi = useApi('clientLocations', ClientApiService.getClientLocations);

	// Clients API for dropdown
	const clientsApi = useApi('clients', async () => {
		return await ClientApiService.getClientLocations({
			city_id: user?.city_id,
			location_type: 3,
			page: 1,
			limit: 1000, // Get all clients for dropdown
		});
	});

	// State
	const [filters, setFilters] = useState<ClientLocationFilters>({
		page: 1,
		limit: 10, // Fixed to match pagination default
		city_id: user?.city_id || undefined, // Use user's city_id from profile
		location_type: 3, // Default location type as requested
		status: 'All', // Default status filter
	});
	const [clientLocations, setClientLocations] = useState<ClientLocation[]>([]);
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		totalCount: 0,
		pageSize: 10,
		currentPage: 1,
		totalPages: 0,
	});

	const [sortBy, setSortBy] = useState<string>('');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	// Handle status toggle
	const handleStatusToggle = async (clientId: number, currentStatus: string) => {
		try {
			setIsUpdatingStatus(true);
			// Toggle status: Active (1) -> InActive (0), InActive (0) -> Active (1)
			const newStatus = currentStatus === 'Active' ? 0 : 1;
			const response = await ClientApiService.updateClientStatus(clientId, newStatus);

			if (response.status_code === 200) {
				setSnackbar({
					open: true,
					message: `Client ${newStatus === 1 ? 'enabled' : 'disabled'} successfully`,
					type: 'success',
				});
				// Reload the client locations
				loadClientLocations();
			} else {
				setSnackbar({
					open: true,
					message: 'Failed to update client status',
					type: 'error',
				});
			}
		} catch (error) {
			console.error('Error updating client status:', error);
			setSnackbar({
				open: true,
				message: 'Error updating client status',
				type: 'error',
			});
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	// Handle sorting
	const handleSort = (key: string, order: 'asc' | 'desc') => {
		setSortBy(key);
		setSortOrder(order);

		// Sort the data locally
		const sortedData = [...clientLocations].sort((a, b) => {
			const aValue = a[key as keyof typeof a];
			const bValue = b[key as keyof typeof b];

			// Handle different data types
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
			}

			// Handle numbers
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				return order === 'asc' ? aValue - bValue : bValue - aValue;
			}

			// Fallback to string comparison
			const aStr = String(aValue || '');
			const bStr = String(bValue || '');
			return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
		});

		setClientLocations(sortedData);
	};

	// Load client locations
	const loadClientLocations = useCallback(
		async (customFilters?: ClientLocationFilters) => {
			const filtersToUse = customFilters || filters;
			try {
				setLoading(true);
				setError(null);

				const response = await clientLocationsApi.execute(filtersToUse);

				// Check both statusCode and status_code for compatibility
				const isSuccess =
					(response as unknown as { statusCode: number }).statusCode === 200 ||
					response.status_code === 200;

				if (isSuccess) {
					// Clear any previous errors
					setError(null);

					// The backend returns data directly as an array
					const locations = (response.data as unknown as ClientLocation[]) || [];
					// Map facility_id to facilityId if needed (API inconsistency)
					const mappedLocations = locations.map(loc => ({
						...loc,
						facilityId: (loc as any).facility_id ?? loc.facilityId,
					}));
					const paginationData =
						(response as unknown as { pagination: PaginationData }).pagination || {};

					setClientLocations(mappedLocations);
					// Store locations in Redux for edit page navigation
					dispatch(setLocations(mappedLocations));
					setPagination({
						totalCount: paginationData.totalCount || mappedLocations.length,
						pageSize: paginationData.pageSize || filters.limit || 25,
						currentPage: paginationData.currentPage || filters.page || 1,
						totalPages:
							paginationData.totalPages ||
							Math.ceil(
								(paginationData.totalCount || mappedLocations.length) /
									(paginationData.pageSize || filters.limit || 25)
							),
					});
				} else {
					setError(
						`API Error: ${(response as unknown as { message?: string; status?: string }).message || (response as unknown as { message?: string; status?: string }).status || 'Unknown error'}`
					);
				}
			} catch (error: unknown) {
				console.error('Failed to load client locations:', error);
				setError(
					`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			} finally {
				setLoading(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[clientLocationsApi]
	);

	// Load clients for dropdown
	const loadClients = useCallback(async () => {
		try {
			const response = await clientsApi.execute({});
			if ((response as any).statusCode === 200) {
				const locations = (response.data as unknown as ClientLocation[]) || [];
				// Extract unique clients from locations
				const uniqueClients = locations.reduce((acc: Client[], location: ClientLocation) => {
					const existingClient = acc.find(client => client.id === location.id);
					if (!existingClient && location.id) {
						acc.push({
							id: location.id,
							restaurant_name: location.restaurant_name,
						});
					}
					return acc;
				}, []);
				setClients(uniqueClients);
			}
		} catch (error: unknown) {
			console.error('Failed to load clients:', error);
		}
	}, [clientsApi]);

	// Load data on mount only
	useEffect(() => {
		loadClientLocations();
		loadClients();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty dependency array - only run once on mount

	// Handle filter changes with local filtering first
	const handleFilterChange = (
		key: keyof ClientLocationFilters,
		value: string | number | undefined
	) => {
		const newFilters = {
			...filters,
			[key]: value ?? undefined,
		};
		setFilters(newFilters);

		// Try local filtering first
		if (key === 'client_id') {
			if (!value) {
				// "All" selected - restore original data
				loadClientLocations(newFilters);
				return;
			} else {
				const filteredData = clientLocations.filter(
					location => location.id === parseInt(value.toString())
				);
				if (filteredData.length > 0) {
					// Found data locally, use it
					setClientLocations(filteredData);
					return;
				}
			}
		}

		// If no local data found or other filters changed, make API call
		loadClientLocations(newFilters);
	};

	// Clear filters
	// const clearFilters = () => {
	// 	const newFilters = {
	// 		page: 1,
	// 		limit: 10,
	// 		city_id: user?.city_id || undefined, // Reset to user's city
	// 		location_type: 3, // Reset to default location type
	// 	};
	// 	setFilters(newFilters);
	// 	loadClientLocations(newFilters);
	// };

	// Pagination handlers
	const handlePageChange = (page: number) => {
		const newFilters = { ...filters, page };
		setFilters(newFilters);
		loadClientLocations(newFilters);
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		const newFilters = { ...filters, page: 1, limit: itemsPerPage };
		setFilters(newFilters);
		loadClientLocations(newFilters);
	};

	// Table columns - relevant business data
	const columns = [
		{
			key: 'serial',
			label: '#',
			title: '#',
			sortable: false,
			width: '60px',
			render: (_value: unknown, _row: Record<string, unknown>, index: number) => (
				<div className='font-semibold text-gray-600 text-center'>
					{(pagination.currentPage - 1) * pagination.pageSize + index + 1}
				</div>
			),
		},
		{
			key: 'actions',
			label: 'Actions',
			title: 'Actions',
			sortable: false,
			render: (_value: unknown, row: Record<string, unknown>) => (
				<Button
					variant='ghost'
					size='sm'
					onClick={() => {
						const location = clientLocations.find(loc => loc.id === row.id);
						if (location) {
							dispatch(setSelectedLocation(location));
							navigate('/clients/edit');
						}
					}}
					className='text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded'
					title='Edit Client'
				>
					<Edit className='w-4 h-4' />
				</Button>
			),
		},
		{
			key: 'restaurant_name',
			label: 'Client',
			title: 'Client',
			sortable: true,
			width: '200px',
			render: (value: unknown) => {
				const clientName = String(value);

				return (
					<div className='relative group'>
						<div
							className='font-semibold text-gray-900'
							style={{
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								maxWidth: '180px',
							}}
						>
							{clientName}
						</div>
						{/* Custom tooltip - accessibility feature */}
						<div className='absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap'>
							{clientName}
							<div className='absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
						</div>
					</div>
				);
			},
		},
		{
			key: 'billingType',
			label: 'Billing',
			title: 'Billing',
			sortable: true,
			render: (value: unknown, row: Record<string, unknown>) => (
				<div className='text-gray-900'>
					<div className='font-medium'>{String(value)}</div>
					{(row.subTypeName as string) && (
						<div className='text-xs text-gray-500 mt-1'>{String(row.subTypeName)}</div>
					)}
				</div>
			),
		},
		{
			key: 'impactTypes',
			label: 'Impact Types',
			title: 'Impact Types',
			sortable: false,
			render: (value: unknown) => {
				// Handle impactTypes array
				let impactTypes = [];
				try {
					if (Array.isArray(value)) {
						impactTypes = value;
					} else if (typeof value === 'string') {
						impactTypes = JSON.parse(value);
					}
				} catch {
					console.warn('Failed to parse impactTypes:', value);
				}

				const impactNames = impactTypes
					.map((impact: unknown) => {
						if (typeof impact === 'object' && impact !== null && 'name' in impact) {
							return (impact as { name: string }).name;
						}
						return String(impact);
					})
					.join(', ');
				return <div className='text-sm text-gray-700 max-w-xs'>{impactNames || 'N/A'}</div>;
			},
		},
		{
			key: 'location_type_name',
			label: 'Type',
			title: 'Type',
			sortable: true,
			render: (value: unknown) => (
				<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
					{String(value)}
				</span>
			),
		},
		{
			key: 'status',
			label: 'Status',
			title: 'Status',
			sortable: true,
			render: (value: unknown, row: Record<string, unknown>) => {
				const status = String(value);
				const isActive = status === 'Active';
				return (
					<StatusToggle
						isActive={isActive}
						onToggle={() => handleStatusToggle(row.id as number, status)}
						disabled={isUpdatingStatus}
					/>
				);
			},
		},
		{
			key: 'coordinates',
			label: 'Coordinates',
			title: 'Coordinates',
			sortable: false,
			render: (_value: unknown, row: Record<string, unknown>) => (
				<div className='text-sm text-gray-600'>
					<div className='font-mono text-xs'>
						<span className='text-blue-600'>Lat:</span> {String(row.latitude || 'N/A')}
					</div>
					<div className='font-mono text-xs'>
						<span className='text-green-600'>Lng:</span> {String(row.longitude || 'N/A')}
					</div>
				</div>
			),
		},
		{
			key: 'address',
			label: 'Address',
			title: 'Address',
			sortable: false,
			render: (_value: unknown, row: Record<string, unknown>) => {
				const address1 = String(row.address_1 || '');
				const address2 = String(row.address_2 || '');
				const landmark = String(row.landmark || '');
				const zipcode = String(row.zipcode || '');

				const fullAddress = [address1, address2, landmark, zipcode]
					.filter(addr => addr.trim())
					.join(', ');

				return (
					<div className='text-sm text-gray-700 max-w-xs truncate' title={fullAddress || 'N/A'}>
						{fullAddress || 'N/A'}
					</div>
				);
			},
		},
	];

	// Action handlers - removed for now since we're only showing location and city

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Manage Clients'
						locationName={
							shouldShowCityFilter
								? 'All Cities'
								: user?.city_id
									? cities.find(c => c.value === user.city_id?.toString())?.label || 'Mumbai'
									: 'Mumbai'
						}
						totalItems={pagination.totalCount}
						itemType='locations'
						icon='🏢'
					/>
					<Button
						onClick={() => navigate('/clients/add')}
						className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
					>
						<Plus className='w-4 h-4 mr-2' />
						Add New Client
					</Button>
				</div>

				{/* Sleek Filter Section */}
				<div className='mb-6 flex w-full '>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<div className='flex items-center gap-4 w-full'>
							{shouldShowCityFilter && (
								<FloatingDropdown
									label='City'
									options={cities.map(city => ({ value: city.value, label: city.label }))}
									value={filters.city_id?.toString() || ''}
									onChange={(value: string) => handleFilterChange('city_id', parseInt(value))}
									loading={citiesLoading}
									placeholder='All Cities'
								/>
							)}

							<FloatingDropdown
								label='Location Type'
								options={locationTypes.map(type => ({ value: type.value, label: type.label }))}
								value={filters.location_type?.toString() || '3'}
								onChange={(value: string) => handleFilterChange('location_type', parseInt(value))}
								loading={locationTypesLoading}
								placeholder='Select Type'
							/>

							<FloatingDropdown
								label='Client'
								options={[
									{ value: '', label: 'All' },
									...clients.map(client => ({
										value: client.id?.toString() || '',
										label: client.restaurant_name || 'Unknown Client',
									})),
								]}
								value={filters.client_id?.toString() || ''}
								onChange={(value: string) =>
									handleFilterChange('client_id', value ? parseInt(value) : undefined)
								}
								loading={clientsApi.loading}
								placeholder='All'
							/>

							<FloatingDropdown
								label='Status'
								options={[
									{ value: 'All', label: 'All' },
									{ value: 'Active', label: 'Active' },
									{ value: 'InActive', label: 'InActive' },
								]}
								value={filters.status || 'All'}
								onChange={(value: string) => handleFilterChange('status', value)}
								placeholder='All'
							/>

							{/* <Button
								variant='ghost'
								size='sm'
								onClick={clearFilters}
								className='text-gray-500 hover:text-gray-700 px-2 py-1 text-sm'
							>
								Reset
							</Button> */}
						</div>
						<SearchButton onClick={() => loadClientLocations(filters)} title='Search' size='md' />
					</div>
				</div>

				{/* Results */}
				<div>
					{error && (
						<div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
							<div className='text-red-800 font-medium'>Error:</div>
							<div className='text-red-700 text-sm mt-1'>{error}</div>
						</div>
					)}

					{loading ? (
						<div className='flex items-center justify-center py-12'>
							<div className='flex items-center gap-3'>
								<div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
								<div className='text-gray-600'>Loading locations...</div>
							</div>
						</div>
					) : clientLocations.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-12'>
							<div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
								<Search className='w-8 h-8 text-gray-400' />
							</div>
							<div className='text-gray-600 text-lg font-medium mb-2'>No locations found</div>
							<div className='text-gray-400 text-sm'>Try adjusting your filters</div>
						</div>
					) : (
						<div>
							<div className='overflow-x-auto'>
								<Table
									columns={columns}
									data={clientLocations as unknown as Record<string, unknown>[]}
									className='min-w-max'
									sortBy={sortBy}
									sortOrder={sortOrder}
									onSort={handleSort}
								/>
							</div>
							<div className='mt-6'>
								<Pagination
									currentPage={pagination.currentPage}
									totalPages={pagination.totalPages}
									totalItems={pagination.totalCount}
									itemsPerPage={pagination.pageSize}
									onPageChange={handlePageChange}
									onItemsPerPageChange={handleItemsPerPageChange}
									showItemsPerPage={true}
								/>
							</div>
						</div>
					)}
				</div>

				{/* Snackbar for notifications */}
				<Snackbar
					open={snackbar.open}
					onClose={() => setSnackbar({ ...snackbar, open: false })}
					message={snackbar.message}
					type={snackbar.type}
				/>
			</div>
		</div>
	);
};

export default ManageClients;
