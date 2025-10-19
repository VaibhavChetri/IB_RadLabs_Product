import React, { useState, useEffect, useCallback } from 'react';
import { ClientApiService } from '../services/clientApi';
import { FloatingDropdown } from '../components/ui';
import { Snackbar } from '../components/ui/Snackbar';

interface Client {
	id: number;
	location: string;
	status: string;
	status_id: number;
}

const DisableClients: React.FC = () => {
	const [clients, setClients] = useState<Client[]>([]);
	const [loading, setLoading] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		show: boolean;
		message: string;
		type: 'success' | 'error' | 'info';
	}>({ show: false, message: '', type: 'success' });

	// Load clients on component mount
	const loadClients = useCallback(async () => {
		try {
			setLoading(true);
			console.log('🔄 Loading clients...');
			
			// Use the existing getClientLocations API instead
			const response = await ClientApiService.getClientLocations({
				page: 1,
				limit: 1000,
				city_id: 3, // Mumbai
				location_type: 3 // Client locations
			});

			console.log('📊 API Response:', response);

			if (response.status_code === 200 && response.data) {
				// Transform the data to match our Client interface
				const clientData = response.data.data.map((location: unknown) => {
					const loc = location as { id: number; location: string; status?: string };
					return {
						id: loc.id,
						location: loc.location,
						status: loc.status || 'Active',
						status_id: loc.status === 'Active' ? 1 : 0
					};
				});
				
				console.log('✅ Clients loaded:', clientData);
				setClients(clientData);
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

	// Status dropdown options
	const statusOptions = [
		{ value: '1', label: 'Active' },
		{ value: '0', label: 'Inactive' },
	];

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
				{/* Header */}
				<div className='mb-8'>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>Disable Clients</h1>
					<p className='text-gray-600'>Manage client status - enable or disable client accounts</p>
				</div>

				{/* Clients List */}
				<div className='bg-white rounded-lg border border-gray-200'>
					<div className='px-6 py-4 border-b border-gray-200'>
						<h2 className='text-lg font-semibold text-gray-900'>Client Status Management</h2>
					</div>

					{loading ? (
						<div className='p-8 text-center'>
							<div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
							<p className='mt-2 text-gray-600'>Loading clients...</p>
						</div>
					) : (
						<div className='divide-y divide-gray-200'>
							{clients.map(client => (
								<div key={client.id} className='p-6 flex items-center justify-between'>
									<div className='flex-1'>
										<h3 className='text-lg font-semibold text-gray-900'>{client.location}</h3>
										<p className='text-sm text-gray-600'>Client ID: {client.id}</p>
									</div>

									<div className='flex items-center space-x-4'>
										<div className='flex items-center space-x-2'>
											<span className='text-sm font-medium text-gray-700'>Status:</span>
											<FloatingDropdown
												label=''
												options={statusOptions}
												value={client.status_id.toString()}
												onChange={value => updateClientStatus(client.id, parseInt(value))}
												className='w-32'
											/>
										</div>

										<div
											className={`px-3 py-1 rounded-full text-xs font-medium ${
												client.status_id === 1
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{client.status}
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{!loading && clients.length === 0 && (
						<div className='p-8 text-center'>
							<p className='text-gray-600'>No clients found</p>
						</div>
					)}
				</div>
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
