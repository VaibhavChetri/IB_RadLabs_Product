import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { RootState } from '../store';
import { FloatingInput, PageHeader, Button, Snackbar, Table } from '../components/ui';
import { KamApiService, ClientInventoryRow } from '../services/kamApi';
import { setClientInventory, setClientInventoryLoading } from '../store/slices/kamSlice';

interface EditedData {
	[id: number]: {
		openingStock: number;
		dispatch: number;
		returned: number;
		closing: number;
	};
}

const ClientInventoryDetails: React.FC = () => {
	const { clientId } = useParams<{ clientId: string }>();
	const location = useLocation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);

	const clientName = (location.state as { clientName: string })?.clientName || `Client ${clientId}`;
	const selectedDateFromState = (location.state as { selectedDate?: string })?.selectedDate;

	const { data, loading } = useSelector((state: RootState) => state.kam.clientInventory);

	const selectedDate = selectedDateFromState || new Date().toISOString().split('T')[0];
	const [editedData, setEditedData] = useState<EditedData>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const STORAGE_KEY = `kam_client_inventory_draft_${clientId}`;

	// Load from local storage on mount
	useEffect(() => {
		const savedDraft = localStorage.getItem(STORAGE_KEY);
		if (savedDraft) {
			try {
				const parsedData = JSON.parse(savedDraft);
				setEditedData(parsedData);
			} catch (error) {
				console.error('Error loading draft:', error);
			}
		}
	}, [clientId]);

	const fetchData = useCallback(async () => {
		if (!clientId) return;

		dispatch(setClientInventoryLoading(true));
		try {
			const response = await KamApiService.getEverydayClientInventory({
				client_id: Number(clientId),
				start_date: selectedDate,
				end_date: selectedDate,
			});
			dispatch(setClientInventory(response.data));
		} catch (error) {
			console.error('Error fetching client inventory:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load inventory data',
				type: 'error',
			});
		} finally {
			dispatch(setClientInventoryLoading(false));
		}
	}, [clientId, selectedDate, dispatch]);

	const columns = [
		{
			key: 'containerType',
			title: 'Container Type',
			width: '250px',
		},
		{
			key: 'openingStock',
			title: 'Opening',
			render: (_: unknown, row: ClientInventoryRow) => (
				<input
					type='number'
					value={
						editedData[row.id]?.openingStock?.toString() || row.openingStock?.toString() || '0'
					}
					onChange={e => handleInputChange(row.id, 'openingStock', Number(e.target.value))}
					className='w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
			),
		},
		{
			key: 'dispatch',
			title: 'Dispatch',
			render: (_: unknown, row: ClientInventoryRow) => (
				<input
					type='number'
					value={editedData[row.id]?.dispatch?.toString() || row.dispatch?.toString() || '0'}
					onChange={e => handleInputChange(row.id, 'dispatch', Number(e.target.value))}
					className='w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
			),
		},
		{
			key: 'returned',
			title: 'Returned',
			render: (_: unknown, row: ClientInventoryRow) => (
				<input
					type='number'
					value={editedData[row.id]?.returned?.toString() || row.returned?.toString() || '0'}
					onChange={e => handleInputChange(row.id, 'returned', Number(e.target.value))}
					className='w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
			),
		},
		{
			key: 'closing',
			title: 'Closing',
			render: (_: unknown, row: ClientInventoryRow) => (
				<input
					type='number'
					value={editedData[row.id]?.closing?.toString() || row.closing?.toString() || '0'}
					disabled
					className='w-24 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-gray-500'
				/>
			),
		},
	];

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleInputChange = (
		id: number,
		field: 'openingStock' | 'dispatch' | 'returned',
		value: number
	) => {
		const currentItem = data.find(item => item.id === id) || {
			openingStock: 0,
			dispatch: 0,
			returned: 0,
			closing: 0,
		};

		// Get current values from edited data or original data
		const currentEdited = editedData[id] || {};
		const opening = currentEdited.openingStock ?? currentItem.openingStock ?? 0;
		const dispatch = currentEdited.dispatch ?? currentItem.dispatch ?? 0;
		const returned = currentEdited.returned ?? currentItem.returned ?? 0;

		// Update the changed field
		const updatedValues = {
			openingStock: field === 'openingStock' ? value : opening,
			dispatch: field === 'dispatch' ? value : dispatch,
			returned: field === 'returned' ? value : returned,
		};

		// Calculate closing stock
		const closing = Math.max(
			0,
			updatedValues.openingStock + updatedValues.returned - updatedValues.dispatch
		);

		const newEditedData = {
			...editedData,
			[id]: {
				...updatedValues,
				closing,
			},
		};

		setEditedData(newEditedData);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newEditedData));
	};

	const handleSubmit = async () => {
		if (!clientId) return;

		if (!data || data.length === 0) {
			console.error('❌ No data available to submit');
			setSnackbar({
				open: true,
				message: 'No inventory data available',
				type: 'error',
			});
			return;
		}

		console.log('📊 Current data before mapping:', data);

		const payload = data.map(item => {
			const edited = editedData[item.id];

			// Helper function to safely convert to number, defaulting to 0 for empty/null/undefined
			const safeNumber = (value: number | string | null | undefined): number => {
				if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
					return 0;
				}
				return Math.max(0, Number(value));
			};

			const openingStock = safeNumber(edited?.openingStock ?? item.openingStock);
			const dispatch = safeNumber(edited?.dispatch ?? item.dispatch);
			const returned = safeNumber(edited?.returned ?? item.returned);
			const closing = safeNumber(edited?.closing ?? item.closing);

			// Format for API: use snake_case
			return {
				id: item.id,
				client_id: item.clientId,
				container_type_id: item.containerTypeId,
				opening_stock: openingStock,
				dispatch: dispatch,
				returned: returned,
				closing: closing,
			};
		});

		console.log('🚀 Submitting inventory payload:', payload);
		console.log('📊 Payload length:', payload.length);
		console.log('📝 Sample item:', payload[0]);

		try {
			await KamApiService.updateEverydayClientInventory(payload);
			localStorage.removeItem(STORAGE_KEY);
			setSnackbar({
				open: true,
				message: 'Inventory updated successfully',
				type: 'success',
			});
			setTimeout(() => {
				navigate('/kam/clients');
			}, 1500);
		} catch (error: any) {
			console.error('❌ Error updating inventory:', error);
			console.error('❌ Error details:', error.response?.data || error.message);
			console.error('❌ Full error object:', error);
			setSnackbar({
				open: true,
				message: `Failed to update inventory: ${error.message || 'Unknown error'}`,
				type: 'error',
			});
		}
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title={clientName}
				locationName={user?.city_name || 'City'}
				totalItems={data?.length || 0}
				itemType='container types'
				icon='📦'
			/>

			{loading ? (
				<div className='text-center py-8'>Loading...</div>
			) : (
				<Table columns={columns} data={data || []} />
			)}

			<div className='flex justify-end mt-6'>
				<Button onClick={handleSubmit} disabled={loading}>
					Submit
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

export default ClientInventoryDetails;
