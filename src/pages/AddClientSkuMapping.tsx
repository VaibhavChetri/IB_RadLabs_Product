import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Snackbar, FloatingDropdown, PageHeader, Button } from '../components/ui';
import { RootState } from '../store';
import { SkuApiService } from '../services/skuApi';
import {
	useSkuMappingForm,
	useClientSkuMapping,
	useSkuSubmission,
	SkuMappingFormSection,
	SkuMappingTable,
} from '../features/sku-mapping';

export const AddClientSkuMapping: React.FC = () => {
	const { clientId } = useParams<{ clientId: string }>();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
	const isEditMode = Boolean(clientId);

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
	} = useSkuMappingForm(isEditMode);
	const { submit, submitting, snackbar, setSnackbar } = useSkuSubmission();

	const [loading, setLoading] = useState(false);
	const [containerTypes, setContainerTypes] = useState<any[]>([]);

	useEffect(() => {
		// Clean up listing menu's localStorage
		localStorage.removeItem('sku-listing-client-id');
		localStorage.removeItem('sku-listing-status');

		// Clean up opposite mode's localStorage to avoid stale data
		if (isEditMode) {
			localStorage.removeItem('sku-mapping-rows');
		} else {
			localStorage.removeItem('sku-mapping-rows-edit');
		}

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
	}, [isEditMode]);

	useEffect(() => {
		if (error) setSnackbar({ open: true, message: error, type: 'error' });
	}, [error, setSnackbar]);

	useEffect(() => {
		if (selectedClientId && clientId) {
			setLoading(true);
			loadExistingMapping(selectedClientId)
				.catch(() =>
					setSnackbar({ open: true, message: 'Failed to load existing mapping', type: 'error' })
				)
				.finally(() => setLoading(false));
		}
	}, [selectedClientId, clientId, loadExistingMapping, setSnackbar]);

	// Add default rows when client is selected in add mode
	useEffect(() => {
		if (!clientId && selectedClient && selectedClient.impactTypes) {
			// Only add default rows if the arrays are still empty
			const allRowsEmpty =
				waterInefficiencyRows.length === 0 &&
				singleUsePpRows.length === 0 &&
				clamshellRows.length === 0;

			if (allRowsEmpty) {
				selectedClient.impactTypes.forEach((impactType: { name: string }) => {
					if (impactType.name === 'Water Inefficiency' && waterInefficiencyRows.length === 0) {
						addRow(impactType.name);
					} else if (impactType.name === 'Single use PP' && singleUsePpRows.length === 0) {
						addRow(impactType.name);
					} else if (impactType.name === 'Clampshell' && clamshellRows.length === 0) {
						addRow('Clamshell');
					}
				});
			}
		}
	}, [
		selectedClient,
		clientId,
		waterInefficiencyRows.length,
		singleUsePpRows.length,
		clamshellRows.length,
		addRow,
	]);

	const handleClientSelect = useCallback(async (_client: { impactTypes: { name: string }[] }) => {
		// This callback is triggered when client is selected
		// Rows will be added by the useEffect above
	}, []);

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

				<div className='bg-background rounded-lg border border-border p-4 mb-6'>
					<FloatingDropdown
						label='Select Client'
						placeholder='Choose a client'
						value={selectedClientId?.toString() || ''}
						onChange={handleClientDropdownChange}
						options={clients.map(client => ({
							value: client.clientId.toString(),
							label: client.clientName,
						}))}
						disabled={isClientLocked}
					/>
				</div>

				{selectedClientId && selectedClient && (
					<div className='space-y-6'>
						{selectedClient.impactTypes.map((impactType: { id: number; name: string }) => (
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
									rows={
										impactType.name === 'Water Inefficiency'
											? waterInefficiencyRows
											: impactType.name === 'Single use PP'
												? singleUsePpRows
												: impactType.name === 'Clampshell'
													? clamshellRows
													: clamshellRows
									}
									columns={[]}
									addRow={addRow}
									removeRow={removeRow}
									updateRow={updateRow}
									containerTypes={containerTypes}
									selectedContainerTypes={
										impactType.name === 'Water Inefficiency'
											? waterInefficiencyRows
													.map(r => r.containerTypeId as number)
													.filter(id => id > 0)
											: impactType.name === 'Single use PP'
												? singleUsePpRows.map(r => r.containerTypeId as number).filter(id => id > 0)
												: impactType.name === 'Clampshell' || impactType.name === 'Clamshell'
													? clamshellRows.map(r => r.containerTypeId as number).filter(id => id > 0)
													: []
									}
									_isEditMode={!!clientId}
								/>
							</div>
						))}
					</div>
				)}

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
