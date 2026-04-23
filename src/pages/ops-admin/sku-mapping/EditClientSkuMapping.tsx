import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, PageHeader, Button } from '../../../components/ui';
import { RootState, AppDispatch } from '../../../store';
import { resetSkuMapping, setSelectedClient } from '../../../store/slices/skuMappingSlice';
import { SkuApiService } from '../../../services/skuApi';
import {
	useSkuMappingFormRedux,
	useSkuSubmission,
	SkuMappingFormSection,
	SkuMappingTable,
} from '../../../features/sku-mapping';

export const EditClientSkuMapping: React.FC = () => {
	const { clientId } = useParams<{ clientId: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const { user } = useSelector((state: RootState) => state.auth);
	const prevClientIdRef = useRef<string | undefined>(undefined);

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
		loadExistingMapping,
	} = useSkuMappingFormRedux();

	const { submit, submitting, snackbar, setSnackbar } = useSkuSubmission();
	const { selectedClient, showCombineSku } = useSelector((state: RootState) => state.skuMapping);
	const [loading, setLoading] = useState(false);
	const [containerTypes, setContainerTypes] = useState<any[]>([]);
	const hasInitializedRef = useRef(false);

	// Load container types
	useEffect(() => {
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
	}, []);

	// Load existing mapping from API when clientId changes
	useEffect(() => {
		const loadMapping = async () => {
			if (clientId) {
				// Check if client changed
				const clientChanged = prevClientIdRef.current !== clientId;

				// Reset ref if client changed so we can load new client
				if (clientChanged) {
					hasInitializedRef.current = false;
				}

				// Only initialize once per client
				if (!hasInitializedRef.current) {
					// Check if we have persisted data (refresh scenario)
					const hasPersistedData =
						waterInefficiencyRows.length > 0 ||
						singleUsePpRows.length > 0 ||
						clamshellRows.length > 0;

					if (clientChanged || !hasPersistedData) {
						// Different client or no persisted data: load from API
						if (clientChanged) {
							// Different client: clear first
							dispatch(resetSkuMapping());
							prevClientIdRef.current = clientId;
						}

						setLoading(true);
						try {
							await loadExistingMapping(Number(clientId));

							// Set client info in Redux
							const response = await SkuApiService.getClientByCity(user?.city_id || 0);
							if (response.status_code === 200 && response.result) {
								const client = response.result.find((c: any) => c.clientId.toString() === clientId);
								if (client) {
									dispatch(setSelectedClient({ client, clientId: Number(clientId) }));
								}
							}
						} catch {
							setSnackbar({
								open: true,
								message: 'Failed to load existing mapping',
								type: 'error',
							});
						} finally {
							setLoading(false);
						}
					}
					// If hasPersistedData and client hasn't changed, do nothing - use persisted data
					hasInitializedRef.current = true;
				}
			}
		};

		loadMapping();
	}, [
		clientId,
		dispatch,
		loadExistingMapping,
		setSnackbar,
		user?.city_id,
		waterInefficiencyRows.length,
		singleUsePpRows.length,
		clamshellRows.length,
	]);

	const totalItems = waterInefficiencyRows.length + singleUsePpRows.length + clamshellRows.length;

	const handleSubmit = () =>
		submit(
			Number(clientId!),
			user!.id,
			waterInefficiencyRows,
			singleUsePpRows,
			clamshellRows,
			electricityConsumed,
			waterConsumed,
			srcingDistance,
			qtyTransportedOneTrip,
			true // isEditMode
		);

	if (loading || !clientId) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-lg'>Loading...</div>
			</div>
		);
	}

	// Dynamically determine which impact types to show based on loaded data
	const impactTypes = [];

	if (waterInefficiencyRows.length > 0) {
		impactTypes.push({ id: 1, name: 'Water Inefficiency' });
	}
	if (singleUsePpRows.length > 0) {
		impactTypes.push({ id: 2, name: 'Single use PP' });
	}
	if (clamshellRows.length > 0) {
		impactTypes.push({ id: 3, name: 'Clamshell' });
	}

	return (
		<div className='min-h-screen bg-background-default p-6'>
			<div className='max-w-7xl mx-auto'>
				<PageHeader
					title={`Edit Client SKU Mapping - ${selectedClient?.clientName || ''}`}
					locationName={user?.city_name || 'City'}
					totalItems={totalItems}
					itemType='mappings'
					icon='📦'
				/>

				{/* Mapping Sections */}
				<div className='space-y-6'>
					{impactTypes.map((impactType: { id: number; name: string }) => {
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
									containerTypes={containerTypes}
									selectedContainerTypes={rowsForImpactType
										.map(r => r.containerTypeId as number)
										.filter(id => id > 0)}
									showCombineSku={showCombineSku}
								/>
							</div>
						);
					})}
				</div>

				{/* Action Buttons */}
				<div className='flex justify-end gap-4 mt-6'>
					<Button
						variant='outline'
						onClick={() => navigate('/ops-admin/map-sku/listing')}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={submitting}>
						{submitting ? 'Saving...' : 'Update'}
					</Button>
				</div>
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

export default EditClientSkuMapping;
