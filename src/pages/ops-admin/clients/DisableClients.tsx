import React, { useState, useEffect, useCallback } from 'react';
import { ClientApiService } from '../../../services/clientApi';
import { Snackbar } from '../../../components/ui/Snackbar';
import { Table } from '../../../components/ui/DataDisplay';
import { Pagination } from '../../../components/ui/Pagination';

interface Client {
	id: number;
	location: string;
	status: string;
	status_id: number;
	[key: string]: unknown;
}

interface TableColumn {
	key: string;
	label: string;
	title: string;
	width?: string;
	render?: (value: unknown, row: Client, index: number) => React.ReactNode;
}

// Sleek Toggle Switch Component
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

const DisableClients: React.FC = () => {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		show: boolean;
		message: string;
		type: 'success' | 'error' | 'info';
	}>({ show: false, message: '', type: 'success' });

	// Pagination state
	const [pagination, setPagination] = useState({
		currentPage: 1,
		pageSize: 10,
		totalCount: 0,
		totalPages: 0,
	});

	// Load clients on component mount
	const loadClients = useCallback(async () => {
		try {
			setLoading(true);
			console.log('🔄 Loading clients...');

			// Use the getAllLocations API as requested
			const response = await ClientApiService.getAllLocations(3); // location_type=3 for clients

			console.log('📊 API Response:', response);

			if (response.statusCode === 200 && response.data) {
				// Transform the API data to match our Client interface
				const clientData = (response.data as unknown[]).map((location: unknown) => {
					const loc = location as { id: number; location: string; status: string };
					return {
						id: loc.id,
						location: loc.location,
						status: loc.status, // "Active" or "Inactive"
						status_id: loc.status === 'Active' ? 1 : 0,
					};
				});

				console.log('✅ Clients loaded:', clientData);
				setClients(clientData);

				// Update pagination
				setPagination(prev => ({
					...prev,
					totalCount: clientData.length,
					totalPages: Math.ceil(clientData.length / prev.pageSize),
				}));
			} else {
				console.error('❌ Failed to load clients:', response);
				setSnackbar({
					show: true,
					message: 'Failed to load clients',
					type: 'error',
				});
			}
		} catch (error) {
			console.error('❌ Error loading clients:', error);
			setSnackbar({
				show: true,
				message: 'Error loading clients',
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, []);

	// Update client status
	const updateClientStatus = async (clientId: number, newStatus: number) => {
		try {
			console.log('🔄 Updating client status:', { clientId, newStatus });
			const response = await ClientApiService.updateClientStatus(clientId, newStatus);

			console.log('📊 Update response:', response);

			if (response.status_code === 200) {
				// Update local state
				setClients(prevClients =>
					prevClients.map(client =>
						client.id === clientId
							? { ...client, status_id: newStatus, status: newStatus === 1 ? 'Active' : 'Inactive' }
							: client
					)
				);

				setSnackbar({
					show: true,
					message: 'Client status updated successfully',
					type: 'success',
				});
			} else {
				setSnackbar({
					show: true,
					message: 'Failed to update client status',
					type: 'error',
				});
			}
		} catch (error) {
			console.error('❌ Error updating client status:', error);
			setSnackbar({
				show: true,
				message: 'Error updating client status',
				type: 'error',
			});
		}
	};

	// Table columns definition
	const columns: TableColumn[] = [
		{
			key: 'serial',
			label: '#',
			title: '#',
			width: '60px',
			render: (_, __, index) => (
				<span className='text-sm font-semibold text-gray-900'>
					{(pagination.currentPage - 1) * pagination.pageSize + index + 1}
				</span>
			),
		},
		{
			key: 'location',
			label: 'Client',
			title: 'Client Name',
			width: '400px',
			render: value => (
				<div className='truncate max-w-[380px]' title={value as string}>
					<span className='text-sm font-semibold text-gray-900'>{value as string}</span>
				</div>
			),
		},
		{
			key: 'status',
			label: 'Status',
			title: 'Client Status',
			width: '180px',
			render: (_, row) => (
				<StatusToggle
					isActive={row.status_id === 1}
					onToggle={() => updateClientStatus(row.id, row.status_id === 1 ? 0 : 1)}
					disabled={loading}
				/>
			),
		},
	];

	// Pagination handlers
	const handlePageChange = (page: number) => {
		setPagination(prev => ({ ...prev, currentPage: page }));
	};

	const handleItemsPerPageChange = (itemsPerPage: number) => {
		setPagination(prev => ({
			...prev,
			pageSize: itemsPerPage,
			currentPage: 1,
			totalPages: Math.ceil(prev.totalCount / itemsPerPage),
		}));
	};

	// Get paginated data
	const paginatedClients = clients.slice(
		(pagination.currentPage - 1) * pagination.pageSize,
		pagination.currentPage * pagination.pageSize
	);

	useEffect(() => {
		console.log('🚀 DisableClients component mounted, loading clients...');
		loadClients();

		// Cleanup function to prevent memory leaks
		return () => {
			console.log('🧹 DisableClients component unmounting...');
			setLoading(false);
		};
	}, [loadClients]); // Include loadClients in dependencies

	return (
		<div className='min-h-screen bg-white p-6'>
			<div className='max-w-7xl mx-auto'>
				{/* Header with useful information */}
				<div className='mb-8'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900 mb-2'>Disable Clients</h1>
							<p className='text-gray-600'>Mumbai • {pagination.totalCount} clients</p>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className='bg-white'>
					<Table columns={columns} data={paginatedClients} loading={loading} className='w-full' />
				</div>

				{/* Pagination */}
				{pagination.totalPages > 0 && (
					<div className='mt-6'>
						<Pagination
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							totalItems={pagination.totalCount}
							itemsPerPage={pagination.pageSize}
							onPageChange={handlePageChange}
							onItemsPerPageChange={handleItemsPerPageChange}
						/>
					</div>
				)}

				{/* Empty state */}
				{!loading && clients.length === 0 && (
					<div className='text-center py-12'>
						<p className='text-gray-600 text-lg'>No clients found</p>
					</div>
				)}
			</div>

			{/* Snackbar */}
			<Snackbar
				open={snackbar.show}
				message={snackbar.message}
				type={snackbar.type}
				onClose={() => setSnackbar(prev => ({ ...prev, show: false }))}
			/>
		</div>
	);
};

export default DisableClients;
