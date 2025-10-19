import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FloatingDropdown, Pagination } from '../components/ui';
import { Table } from '../components/ui/DataDisplay';
import { useApi } from '../hooks/useApi';
import {
	ClientApiService,
	ClientLocation,
	ClientLocationFilters,
	Client,
} from '../services/clientApi';
import { useLocationTypes, useCities } from '../hooks/useLocationData';
import { Search, Plus, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setLocations, setSelectedLocation } from '../store/slices/clientSlice';

export const ManageClients: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const { locations: reduxLocations } = useSelector((state: RootState) => state.client);

	// Debug Redux state
	console.log('🔍 Redux user state:', user);
	console.log('🔍 Redux user city_id:', user?.city_id);
	console.log('🔍 Redux user userTypeId:', user?.userTypeId);

	// Check if city filter should be shown (only for user_type_id 1,2,3,4)
	const shouldShowCityFilter = user?.userTypeId && [1, 2, 3, 4].includes(user.userTypeId);

	// API hooks
	const { locationTypes, loading: locationTypesLoading } = useLocationTypes();
	const { cities, loading: citiesLoading } = useCities();

	// Client locations API
	const clientLocationsApi = useApi('clientLocations', ClientApiService.getClientLocations);

	// State
	const [filters, setFilters] = useState<ClientLocationFilters>({
		page: 1,
		limit: 10, // Fixed to match pagination default
		city_id: user?.city_id || undefined, // Use user's city_id from profile
		location_type: 3, // Default location type as requested
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

	// Debug component state
	console.log('🔍 Component filters:', filters);
	console.log('🔍 Component clientLocations:', clientLocations);
	console.log('🔍 Component loading:', loading);
	console.log('🔍 Component error:', error);

	// Load client locations
	const loadClientLocations = useCallback(
		async (customFilters?: ClientLocationFilters) => {
			const filtersToUse = customFilters || filters;
			try {
				setLoading(true);
				setError(null);
				console.log('Loading client locations with filters:', filtersToUse);

				const response = await clientLocationsApi.execute(filtersToUse);
				console.log('🔍 FULL API Response:', response);
				console.log('📊 Response statusCode:', (response as any).statusCode);
				console.log('📊 Response status_code:', response.status_code);
				console.log('📦 Response data:', response.data);

				// Check both statusCode and status_code for compatibility
				const isSuccess = (response as any).statusCode === 200 || response.status_code === 200;

				if (isSuccess) {
					// Clear any previous errors
					setError(null);

					// The backend returns data directly as an array
					const locations = (response.data as any) || [];
					const paginationData = (response as any).pagination || {};

					console.log('📍 Locations found:', locations.length);
					console.log('📍 First location:', locations[0]);
					console.log('📍 Pagination data:', paginationData);

					setClientLocations(locations);
					// Store locations in Redux for edit page navigation
					dispatch(setLocations(locations));
					setPagination({
						totalCount: paginationData.totalCount || locations.length,
						pageSize: paginationData.pageSize || filters.limit || 25,
						currentPage: paginationData.currentPage || filters.page || 1,
						totalPages:
							paginationData.totalPages ||
							Math.ceil(
								(paginationData.totalCount || locations.length) /
									(paginationData.pageSize || filters.limit || 25)
							),
					});
					console.log('✅ State updated with locations and pagination');

					// Extract unique clients from locations
					const uniqueClients = locations.reduce((acc: Client[], location: ClientLocation) => {
						const existingClient = acc.find(client => client.id === location.restaurant_id);
						if (!existingClient) {
							acc.push({
								id: location.restaurant_id,
								name: location.restaurant_name,
								restaurant_name: location.restaurant_name,
							});
						}
						return acc;
					}, []);
					setClients(uniqueClients);
				} else {
					setError(
						`API Error: ${(response as any).message || (response as any).status || 'Unknown error'}`
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

	// Load data on mount only
	useEffect(() => {
		loadClientLocations();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty dependency array - only run once on mount

	// Handle filter changes with auto-search
	const handleFilterChange = (key: keyof ClientLocationFilters, value: string | number) => {
		const newFilters = {
			...filters,
			[key]: value || undefined,
		};
		setFilters(newFilters);
		// Auto-search when filters change
		loadClientLocations(newFilters);
	};

	// Clear filters
	const clearFilters = () => {
		const newFilters = {
			page: 1,
			limit: 10,
			city_id: user?.city_id || undefined, // Reset to user's city
			location_type: 3, // Reset to default location type
		};
		setFilters(newFilters);
		loadClientLocations(newFilters);
	};

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
			key: 'restaurant_name',
			label: 'Client',
			title: 'Client',
			render: (value: unknown) => (
				<div className='font-semibold text-gray-900'>{String(value)}</div>
			),
		},
		{
			key: 'city_name',
			label: 'City',
			title: 'City',
			render: (value: unknown, row: Record<string, unknown>) => (
				<div className='text-gray-900'>
					<div className='font-medium'>{String(value)}</div>
					<div className='text-sm text-gray-500'>
						{String(row.state_name)}, {String(row.country_name)}
					</div>
				</div>
			),
		},
		{
			key: 'address',
			label: 'Address',
			title: 'Address',
			render: (value: unknown, row: Record<string, unknown>) => {
				const address1 = String(row.address_1 || '');
				const address2 = String(row.address_2 || '');
				const landmark = String(row.landmark || '');
				const zipcode = String(row.zipcode || '');

				const fullAddress = [address1, address2, landmark, zipcode]
					.filter(addr => addr.trim())
					.join(', ');

				return <div className='text-sm text-gray-700 max-w-xs'>{fullAddress || 'N/A'}</div>;
			},
		},
		{
			key: 'coordinates',
			label: 'Coordinates',
			title: 'Coordinates',
			render: (value: unknown, row: Record<string, unknown>) => (
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
			key: 'billingType',
			label: 'Billing',
			title: 'Billing',
			render: (value: unknown, row: Record<string, unknown>) => (
				<div className='text-gray-900'>
					<div className='font-medium'>{String(value)}</div>
					{row.subTypeName && (
						<div className='text-xs text-gray-500 mt-1'>{String(row.subTypeName)}</div>
					)}
				</div>
			),
		},
		{
			key: 'impactTypes',
			label: 'Impact Types',
			title: 'Impact Types',
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
			key: 'status',
			label: 'Status',
			title: 'Status',
			render: (value: unknown) => (
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						String(value) === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
					}`}
				>
					{String(value)}
				</span>
			),
		},
		{
			key: 'location_type_name',
			label: 'Type',
			title: 'Type',
			render: (value: unknown) => (
				<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
					{String(value)}
				</span>
			),
		},
		{
			key: 'actions',
			label: 'Actions',
			title: 'Actions',
			render: (value: unknown, row: Record<string, unknown>) => (
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
				>
					<Edit className='w-4 h-4' />
				</Button>
			),
		},
	];

	// Action handlers - removed for now since we're only showing location and city

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='flex items-center justify-between mb-6'>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>Manage Clients</h1>
						<p className='text-foreground-muted mt-1'>View and manage client locations</p>
					</div>
					<Button
						onClick={() => navigate('/clients/add')}
						className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors'
					>
						<Plus className='w-4 h-4 mr-2' />
						Add Client
					</Button>
				</div>

				{/* Clean Filter Section */}
				<div className='mb-8'>
					<div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
						<div className='flex items-center gap-6'>
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
								options={clients.map(client => ({
									value: client.id?.toString() || '',
									label: client.name || client.restaurant_name || 'Unknown Client',
								}))}
								value={filters.client_id?.toString() || ''}
								onChange={(value: string) => handleFilterChange('client_id', parseInt(value))}
								loading={loading}
								placeholder='All Clients'
							/>

							<Button
								onClick={() => loadClientLocations(filters)}
								className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2'
							>
								<Search className='w-4 h-4' />
							</Button>

							<Button
								variant='ghost'
								size='sm'
								onClick={clearFilters}
								className='text-gray-500 hover:text-gray-700 px-3 py-1'
							>
								Reset
							</Button>
						</div>
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
							<div className='overflow-x-auto overflow-hidden rounded-lg border border-gray-200'>
								<Table
									columns={columns}
									data={clientLocations as unknown as Record<string, unknown>[]}
									className='min-w-max'
								/>
							</div>
							{pagination.totalPages > 1 && (
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
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ManageClients;
