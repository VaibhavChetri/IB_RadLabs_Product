import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { PageHeader, Button, Snackbar, Table } from '../../components/ui';
import { KamApiService, ClientInventoryRow } from '../../services/kamApi';
import { setClientInventory, setClientInventoryLoading } from '../../store/slices/kamSlice';

interface EditedData {
	[id: number]: {
		openingStock: number;
		dispatch: number;
		returned: number;
		closing: number;
	};
}

const ClientInventoryDetails: React.FC = () => {
	const { clientId, date } = useParams<{ clientId: string; date: string }>();
	const location = useLocation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);

	const clientName = (location.state as { clientName: string })?.clientName || `Client ${clientId}`;

	// Get date from URL parameter - this is the source of truth
	// If no date in URL, fallback to today
	const selectedDate = date || new Date().toISOString().split('T')[0];
	const { data, loading } = useSelector((state: RootState) => state.kam.clientInventory);

	const [editedData, setEditedData] = useState<EditedData>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	// Include date in storage key to prevent cross-date contamination
	const STORAGE_KEY = `kam_client_inventory_draft_${clientId}_${selectedDate}`;

	// Load from local storage on mount - only for the current date
	// Also clear old drafts when date changes
	useEffect(() => {
		// Clear all drafts for this client that are NOT for the current date
		if (clientId) {
			const keysToRemove: string[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (
					key &&
					key.startsWith(`kam_client_inventory_draft_${clientId}_`) &&
					key !== STORAGE_KEY
				) {
					keysToRemove.push(key);
				}
			}
			keysToRemove.forEach(key => {
				console.log('🗑️ Removing old draft:', key);
				localStorage.removeItem(key);
			});
		}

		const savedDraft = localStorage.getItem(STORAGE_KEY);
		if (savedDraft) {
			try {
				const parsedData = JSON.parse(savedDraft);
				setEditedData(parsedData);
				console.log('📦 Loaded draft for date:', selectedDate, parsedData);
			} catch (error) {
				console.error('Error loading draft:', error);
				setEditedData({});
			}
		} else {
			// Clear edited data when date changes or no draft exists
			setEditedData({});
		}

		// Cleanup: Clear localStorage when navigating away from this page
		return () => {
			if (clientId && selectedDate) {
				console.log('🧹 Clearing localStorage draft on navigation away:', STORAGE_KEY);
				localStorage.removeItem(STORAGE_KEY);
				// Also clear all drafts for this client to ensure clean state
				const keysToRemove: string[] = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key && key.startsWith(`kam_client_inventory_draft_${clientId}_`)) {
						keysToRemove.push(key);
					}
				}
				keysToRemove.forEach(key => {
					console.log('🗑️ Clearing draft on unmount:', key);
					localStorage.removeItem(key);
				});
			}
		};
	}, [clientId, selectedDate, STORAGE_KEY]);

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
			title: 'Opening@Client',
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
			title: 'DispatchToClient',
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
			title: 'ReturnedToFacility',
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
			title: 'Closing@Client',
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
		console.log('🔄 Fetching data for date:', selectedDate);
		fetchData();
	}, [fetchData, selectedDate]);

	// Clear Redux data when date changes to prevent stale data
	useEffect(() => {
		dispatch(setClientInventory([]));
	}, [selectedDate, dispatch]);

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

		// Calculate closing stock: opening + returned - dispatch
		const closing = Math.max(
			0,
			updatedValues.openingStock + updatedValues.dispatch - updatedValues.returned
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
		console.log('💾 Saved draft for date:', selectedDate, newEditedData);
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

			// Format for API: use snake_case - matching the required structure
			return {
				id: item.id, // Required - record ID
				client_id: item.clientId, // Required
				container_type_id: item.containerTypeId, // Required
				opening_stock: openingStock, // Required
				dispatch: dispatch, // Required
				returned: returned, // Required
				closing: closing, // Required
			};
		});

		console.log('🚀 Submitting inventory payload:', payload);
		console.log('📊 Payload length:', payload.length);
		console.log('📝 Sample item:', payload[0]);

		try {
			console.log('📅 Submitting for date:', selectedDate);
			console.log('📊 Payload with date context:', { date: selectedDate, payload });
			const response = await KamApiService.updateEverydayClientInventory(payload);
			console.log('✅ Update API response:', response);

			// Clear draft for this specific date and client from localStorage
			localStorage.removeItem(STORAGE_KEY);
			console.log('✅ Cleared localStorage draft for client:', clientId, 'date:', selectedDate);

			// Also clear any other drafts for this client (cleanup)
			if (clientId) {
				const keysToRemove: string[] = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key && key.startsWith(`kam_client_inventory_draft_${clientId}_`)) {
						keysToRemove.push(key);
					}
				}
				keysToRemove.forEach(key => {
					localStorage.removeItem(key);
					console.log('🗑️ Cleared additional draft:', key);
				});
			}

			// Clear edited data state
			setEditedData({});
			console.log('✅ Cleared edited data state');

			setSnackbar({
				open: true,
				message: 'Inventory updated successfully',
				type: 'success',
			});
			setTimeout(() => {
				// Navigate back to inventory listing page
				navigate('/kam/inventory');
			}, 1500);
		} catch (error: unknown) {
			console.error('❌ Error updating inventory:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const errorDetails = (error as { response?: { data?: unknown } })?.response?.data;
			console.error('❌ Error details:', errorDetails || errorMessage);
			console.error('❌ Full error object:', error);
			setSnackbar({
				open: true,
				message: `Failed to update inventory: ${errorMessage}`,
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

			{/* Date Display */}
			<div className='bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<span className='text-sm font-medium text-blue-900'>Selected Date:</span>
					<span className='text-sm text-blue-700'>{selectedDate}</span>
				</div>
				<button
					onClick={() => navigate('/kam/clients')}
					className='text-sm text-blue-600 hover:text-blue-800 underline'
				>
					← Back to Client List
				</button>
			</div>

			{loading ? (
				<div className='text-center py-8'>Loading...</div>
			) : (
				<Table<ClientInventoryRow> columns={columns} data={data || []} />
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
