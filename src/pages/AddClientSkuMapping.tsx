import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, FloatingDropdown, PageHeader, Button } from '../components/ui';
import { RootState } from '../store';
import { SkuApiService } from '../services/skuApi';
import { resetSkuMapping } from '../store/slices/skuMappingSlice';
import {
	useSkuMappingFormRedux,
	useClientSkuMapping,
	useSkuSubmission,
	SkuMappingFormSection,
	SkuMappingTable,
} from '../features/sku-mapping';

export const AddClientSkuMapping: React.FC = () => {
	const { clientId } = useParams<{ clientId: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const isEditMode = Boolean(clientId);
	const lastModeRef = useRef<'add' | 'edit' | null>(null);

	// 🔹 Note: PersistGate already handles rehydration, so we don't need manual tracking

	const {
		clients,
		selectedClientId,
		selectedClient,
		isClientLocked,
		loading: clientsLoading,
		error,
		handleClientChange,
	} = useClientSkuMapping(clientId);

	const {
		waterInefficiencyRows,
		singleUsePpRows,
		clamshellRows,
		electricityConsumed,
		setElectricityConsumed,
		waterConsumed,
		setWaterConsumed,
		srcingDistance,
		setSrcingDistance,
		qtyTransportedOneTrip,
		setQtyTransportedOneTrip,
		addRow,
		removeRow,
		updateRow,
		loadExistingMapping,
	} = useSkuMappingFormRedux();

	const { submit, submitting, snackbar, setSnackbar } = useSkuSubmission();
	const [loading, setLoading] = useState(false);
	const [containerTypes, setContainerTypes] = useState<any[]>([]);

	// Clear Redux state when switching modes to prevent stale data
	useEffect(() => {
		const currentMode = isEditMode ? 'edit' : 'add';
		if (lastModeRef.current && lastModeRef.current !== currentMode) {
			dispatch(resetSkuMapping());
		}
		lastModeRef.current = currentMode;

		const loadContainerTypes = async () => {
			try {
				const response = await SkuApiService.getContainerTypes();
				if (response.status_code === 200 && response.data) {
					setContainerTypes(response.data);
				}
			} catch (error) {
				console.error('Failed to load container types:', error);
			}
		};
		loadContainerTypes();
	}, [isEditMode, dispatch]);

	useEffect(() => {
		if (error) setSnackbar({ open: true, message: error, type: 'error' });
	}, [error, setSnackbar]);

	// Load existing mapping in edit mode (only if no persisted data)
	useEffect(() => {
		if (selectedClientId && clientId) {
			const totalRows =
				waterInefficiencyRows.length + singleUsePpRows.length + clamshellRows.length;

			// Only load from API if there's no existing data (either persisted or fetched)
			if (totalRows === 0) {
				setLoading(true);
				loadExistingMapping(selectedClientId)
					.catch(() =>
						setSnackbar({
							open: true,
							message: 'Failed to load existing mapping',
							type: 'error',
						})
					)
					.finally(() => setLoading(false));
			}
		}
	}, [
		selectedClientId,
		clientId,
		waterInefficiencyRows.length,
		singleUsePpRows.length,
		clamshellRows.length,
		loadExistingMapping,
		setSnackbar,
	]);

	// When user selects client, add default rows only if needed
	const handleClientSelect = useCallback(
		async (client: { impactTypes: { name: string }[] }) => {
			const totalRows =
				waterInefficiencyRows.length + singleUsePpRows.length + clamshellRows.length;

			if (totalRows === 0) {
				client.impactTypes.forEach((impactType: { name: string }) => {
					if (impactType.name === 'Water Inefficiency') {
						addRow(impactType.name);
					} else if (impactType.name === 'Single use PP') {
						addRow(impactType.name);
					} else if (impactType.name === 'Clampshell') {
						addRow('Clamshell');
					}
				});
			}
		},
		[waterInefficiencyRows.length, singleUsePpRows.length, clamshellRows.length, addRow]
	);

	const handleClientDropdownChange = async (clientIdStr: string) =>
		await handleClientChange(clientIdStr, handleClientSelect);

	const handleSubmit = () =>
		submit(
			selectedClientId!,
			user!.id,
			waterInefficiencyRows,
			singleUsePpRows,
			clamshellRows,
			electricityConsumed,
			waterConsumed,
			srcingDistance,
			qtyTransportedOneTrip,
			!!clientId
		);

	if (loading || clientsLoading)
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-lg'>Loading...</div>
			</div>
		);

	return (
		<div className='min-h-screen bg-background-default p-6'>
			<div className='max-w-7xl mx-auto'>
				<PageHeader
					title={clientId ? 'Edit Client SKU Mapping' : 'Add Client SKU Mapping'}
					locationName={user?.city_name || 'City'}
					totalItems={0}
					itemType='mappings'
					icon='📦'
				/>

				{/* Client Selector */}
				<div className='bg-background rounded-lg border border-border p-4 mb-6'>
					<FloatingDropdown
						label='Select Client'
						placeholder='Choose a client'
						value={selectedClientId?.toString() || ''}
						onChange={handleClientDropdownChange}
						options={
							clients?.map(client => ({
								value: client.clientId.toString(),
								label: client.clientName,
							})) || []
						}
						disabled={isClientLocked}
					/>
				</div>

				{/* Mapping Sections */}
				{selectedClientId && selectedClient && selectedClient.impactTypes && (
					<div className='space-y-6'>
						{selectedClient.impactTypes.map((impactType: { id: number; name: string }) => {
							const rowsForImpactType =
								impactType.name === 'Water Inefficiency'
									? waterInefficiencyRows
									: impactType.name === 'Single use PP'
										? singleUsePpRows
										: clamshellRows;

							return (
								<div
									key={impactType.id}
									className='bg-background rounded-lg border border-border p-6'
								>
									<SkuMappingFormSection
										impactType={impactType.name}
										electricityConsumed={electricityConsumed}
										setElectricityConsumed={setElectricityConsumed}
										waterConsumed={waterConsumed}
										setWaterConsumed={setWaterConsumed}
										srcingDistance={srcingDistance}
										setSrcingDistance={setSrcingDistance}
										qtyTransportedOneTrip={qtyTransportedOneTrip}
										setQtyTransportedOneTrip={setQtyTransportedOneTrip}
									/>
									<SkuMappingTable
										impactType={impactType.name === 'Clampshell' ? 'Clamshell' : impactType.name}
										rows={rowsForImpactType}
										columns={[]}
										addRow={addRow}
										removeRow={removeRow}
										updateRow={updateRow}
										containerTypes={containerTypes}
										selectedContainerTypes={rowsForImpactType
											.map(r => r.containerTypeId as number)
											.filter(id => id > 0)}
										_isEditMode={!!clientId}
									/>
								</div>
							);
						})}
					</div>
				)}

				{/* Action Buttons */}
				{selectedClientId && (
					<div className='flex justify-end gap-4 mt-6'>
						<Button
							variant='outline'
							onClick={() => navigate('/ops-admin/map-sku/listing')}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? 'Saving...' : clientId ? 'Update' : 'Submit'}
						</Button>
					</div>
				)}
			</div>

			{/* Snackbar */}
			<Snackbar
				open={snackbar.open}
				message={snackbar.message}
				type={snackbar.type}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
			/>
		</div>
	);
};

export default AddClientSkuMapping;
