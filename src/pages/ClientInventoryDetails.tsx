import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { RootState } from '../store';
import { FloatingInput, PageHeader, Button, Snackbar } from '../components/ui';
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

	const { data, loading } = useSelector((state: RootState) => state.kam.clientInventory);

	const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
	const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
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

	const fetchData = async () => {
		if (!clientId) return;

		dispatch(setClientInventoryLoading(true));
		try {
			const response = await KamApiService.getEverydayClientInventory({
				client_id: Number(clientId),
				start_date: startDate,
				end_date: endDate,
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
	};

	useEffect(() => {
		fetchData();
	}, [startDate, endDate, clientId]);

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

		const payload = data.map(item => {
			const edited = editedData[item.id];
			const openingStock = edited?.openingStock ?? item.openingStock ?? 0;
			const dispatch = edited?.dispatch ?? item.dispatch ?? 0;
			const returned = edited?.returned ?? item.returned ?? 0;
			const closing = edited?.closing ?? item.closing ?? 0;

			// Format for API: use snake_case
			return {
				id: item.id,
				client_id: item.clientId,
				container_type_id: item.containerTypeId,
				opening_stock: Math.max(0, Number(openingStock)),
				dispatch: Math.max(0, Number(dispatch)),
				returned: Math.max(0, Number(returned)),
				closing: Math.max(0, Number(closing)),
			};
		});

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
		} catch (error) {
			console.error('Error updating inventory:', error);
			setSnackbar({
				open: true,
				message: 'Failed to update inventory',
				type: 'error',
			});
		}
	};

	return (
		<div className='space-y-6'>
			<PageHeader
				title={clientName}
				locationName={user?.city_name || 'City'}
				totalItems={data.length}
				itemType='container types'
				icon='📦'
			/>

			<div className='bg-white p-4 shadow-sm rounded-lg flex flex-wrap gap-4 items-center mb-6'>
				<FloatingInput
					type='date'
					label='From Date'
					value={startDate}
					onChange={setStartDate}
					className='w-48'
				/>
				<FloatingInput
					type='date'
					label='To Date'
					value={endDate}
					onChange={setEndDate}
					className='w-48'
				/>
			</div>

			{loading ? (
				<div className='text-center py-8'>Loading...</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{data.map(item => (
						<div key={item.id} className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
							<h3 className='text-lg font-semibold text-gray-900 mb-4'>{item.containerType}</h3>

							<div className='space-y-4'>
								<FloatingInput
									type='number'
									label='Opening Stock'
									value={
										editedData[item.id]?.openingStock?.toString() ||
										item.openingStock?.toString() ||
										'0'
									}
									onChange={value => handleInputChange(item.id, 'openingStock', Number(value))}
								/>

								<FloatingInput
									type='number'
									label='Dispatch'
									value={
										editedData[item.id]?.dispatch?.toString() || item.dispatch?.toString() || '0'
									}
									onChange={value => handleInputChange(item.id, 'dispatch', Number(value))}
								/>

								<FloatingInput
									type='number'
									label='Returned'
									value={
										editedData[item.id]?.returned?.toString() || item.returned?.toString() || '0'
									}
									onChange={value => handleInputChange(item.id, 'returned', Number(value))}
								/>

								<FloatingInput
									type='number'
									label='Closing'
									value={
										editedData[item.id]?.closing?.toString() || item.closing?.toString() || '0'
									}
									disabled
									className='bg-gray-50'
								/>
							</div>
						</div>
					))}
				</div>
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
