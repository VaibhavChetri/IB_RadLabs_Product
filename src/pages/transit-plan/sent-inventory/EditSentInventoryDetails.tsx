import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Button, PageHeader, Snackbar } from '../../../components/ui';
import { TransitPlanApi, ClientSkuMapItem } from '../../../services/transitPlanApi';
import ContainerTypesSection from '../../../components/ContainerTypesSection';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const EditSentInventoryDetails: React.FC = () => {
	const params = useParams<{
		clientLocationId: string;
		facilityId: string;
	}>();
	
	const location = useLocation();
	
	// Extract from URL params, fallback to row data if params are missing
	const locationState = location.state as any;
	const rowFromState = locationState?.row;
	
	// Use URL params first, fallback to row data from navigation state
	const clientLocationId = params.clientLocationId || String(rowFromState?.clientId || '');
	const facilityId = params.facilityId || String(rowFromState?.facilityId || '');
	
	console.log('🔍 Extracted IDs:', { 
		paramsClientLocationId: params.clientLocationId, 
		paramsFacilityId: params.facilityId,
		rowClientId: rowFromState?.clientId,
		rowFacilityId: rowFromState?.facilityId,
		finalClientLocationId: clientLocationId,
		finalFacilityId: facilityId
	});

	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);

	// Component state
	const [clientName, setClientName] = useState<string>('');
	const [dispatchDateTime, setDispatchDateTime] = useState<string>('');
	const [skuMapData, setSkuMapData] = useState<ClientSkuMapItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [loadingExistingData, setLoadingExistingData] = useState(false);

	// Form state
	const [adhocTransportation, setAdhocTransportation] = useState(false);
	const [dispatchVehicleNumber, setDispatchVehicleNumber] = useState('');
	const [signatureName, setSignatureName] = useState('');
	const [containerCounts, setContainerCounts] = useState<Record<number, number>>({});
	const [recordIds, setRecordIds] = useState<Record<number, number>>({}); // Map containerTypeId to record ID

	// Compute storage key - will be updated when dispatchDateTime is available
	const getStorageKey = () => {
		if (clientLocationId && facilityId && dispatchDateTime) {
			return `edit-sent-inventory-${clientLocationId}-${facilityId}-${dispatchDateTime}`;
		}
		return `edit-sent-inventory-${clientLocationId}-${facilityId}`;
	};

	// Custom hooks - key will be updated via useEffect when dispatchDateTime is set
	const { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } =
		useLocalStorage(getStorageKey());

	// Snackbar state
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	// Auto-save function
	const autoSave = React.useCallback(() => {
		saveToLocalStorage({
			adhocTransportation,
			dispatchVehicleNumber,
			signatureName,
			containerCounts,
		});
	}, [
		adhocTransportation,
		dispatchVehicleNumber,
		signatureName,
		containerCounts,
		saveToLocalStorage,
	]);

	// Initialize data from navigation state
	useEffect(() => {
		if (location.state) {
			const { row, dispatchDateTime: dt, clientName: name } = location.state as {
				row: any;
				dispatchDateTime: string;
				clientName: string;
			};

			console.log('🔍 Edit page navigation state:', { row, dt, name });
			console.log('🔍 URL params - clientLocationId:', clientLocationId, 'facilityId:', facilityId);
			console.log('🔍 Row data:', row);
			setClientName(name || '');
			setDispatchDateTime(dt || '');
		} else {
			// Handle page refresh scenario - redirect back to listing
			console.log('⚠️ No navigation state found, redirecting to listing page');
			navigate('/transit-plan/sent/inventory');
		}
	}, [location.state, navigate, clientLocationId, facilityId]);


	// Load from localStorage when dispatchDateTime is set
	// Note: Container counts will be set after SKU map is loaded from row data
	useEffect(() => {
		if (!dispatchDateTime || !clientLocationId || !facilityId) return;

		// Load saved draft from localStorage if exists
		const savedDraft = loadFromLocalStorage();
		if (savedDraft) {
			console.log('🔄 Loading draft from localStorage:', savedDraft);
			// Only load non-container fields from localStorage
			// Container counts should come from row data, not localStorage
			setAdhocTransportation(savedDraft.adhocTransportation || false);
			setDispatchVehicleNumber(savedDraft.dispatchVehicleNumber || '');
			setSignatureName(savedDraft.signatureName || '');
			// Set loading to false since we loaded from localStorage
			setLoadingExistingData(false);
		} else {
			// If no draft, set default signature name
			const firstName = user?.name?.split(' ')[0] || '';
			setSignatureName(firstName);
			setLoadingExistingData(false);
		}
	}, [dispatchDateTime, clientLocationId, facilityId, loadFromLocalStorage, user?.name]);


	// Fetch SKU map data
	useEffect(() => {
		const fetchSkuMapData = async () => {
			if (!clientLocationId || !facilityId) {
				console.warn('⚠️ Missing clientLocationId or facilityId:', { clientLocationId, facilityId });
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				console.log(
					'🔍 Fetching SKU map for clientLocationId:',
					clientLocationId,
					'facilityId:',
					facilityId
				);
				const data = await TransitPlanApi.getClientSkuMap(
					Number(clientLocationId),
					Number(facilityId)
				);
				console.log('🔍 SKU map data received:', data);
				console.log('🔍 SKU map data length:', data?.length);
				console.log('🔍 SKU map data type:', Array.isArray(data) ? 'array' : typeof data);
				
				if (!data || !Array.isArray(data) || data.length === 0) {
					console.error('❌ SKU map data is empty or invalid:', data);
					setSnackbar({
						open: true,
						message: 'No container types found for this client and facility',
						type: 'error',
					});
				}
				
				setSkuMapData(data || []);

				// After SKU map is loaded, map existing data from row
				const row = (location.state as any)?.row;
				console.log('🔍 Row data for container mapping:', row);
				console.log('🔍 Row SKUs:', row?.skus);
				console.log('🔍 dispatchDateTime:', dispatchDateTime);
				
				// Check if we have row data with SKUs (dispatchDateTime is optional for this check)
				if (row && row.skus && Array.isArray(row.skus) && row.skus.length > 0) {
					// Map SKUs to container counts using containerTypeId directly
					// Store both count and record ID for update
					const counts: Record<number, number> = {};
					const recordIds: Record<number, number> = {}; // Map containerTypeId to record ID
					
					row.skus.forEach((skuItem: { 
						sku: string; 
						count: number;
						containerTypeId: number;
						id: number; // Record ID from API
					}) => {
						// Use containerTypeId directly from the row data
						if (skuItem.containerTypeId) {
							counts[skuItem.containerTypeId] = skuItem.count || 0;
							if (skuItem.id) {
								recordIds[skuItem.containerTypeId] = skuItem.id;
							}
							console.log(`✅ Mapped containerTypeId: ${skuItem.containerTypeId} with count: ${skuItem.count}, id: ${skuItem.id}`);
						} else {
							console.warn(`⚠️ Missing containerTypeId for SKU: ${skuItem.sku}`, skuItem);
						}
					});
					
					// Store record IDs in state for use in submit
					setRecordIds(recordIds);

					// Merge with SKU map to ensure all container types are present (set missing ones to 0)
					data.forEach(item => {
						if (!(item.containerTypeId in counts)) {
							counts[item.containerTypeId] = 0;
						}
					});

					console.log('🔄 Final merged container counts:', counts);
					console.log('🔄 Record IDs:', recordIds);
					setContainerCounts(counts);
					setLoadingExistingData(false); // Data loaded successfully
				} else {
					console.warn('⚠️ No row data or SKUs found, initializing with zeros', {
						hasRow: !!row,
						hasSkus: !!row?.skus,
						isArray: Array.isArray(row?.skus),
						skusLength: row?.skus?.length,
					});
					// No existing data, just initialize with zeros
					const mergedCounts: Record<number, number> = {};
					data.forEach(item => {
						mergedCounts[item.containerTypeId] = 0;
					});
					setContainerCounts(mergedCounts);
					setLoadingExistingData(false);
				}
			} catch (error) {
				console.error('❌ Error fetching SKU map data:', error);
				setSnackbar({
					open: true,
					message: 'Failed to load client data',
					type: 'error',
				});
			} finally {
				setLoading(false);
			}
		};

		fetchSkuMapData();
	}, [clientLocationId, facilityId, location.state, dispatchDateTime]);

	// Auto-save when form data changes
	useEffect(() => {
		if (clientLocationId && facilityId && clientName && dispatchDateTime) {
			autoSave();
		}
	}, [clientLocationId, facilityId, clientName, dispatchDateTime, autoSave]);

	// Event handlers
	const handleContainerCountChange = (containerTypeId: number, count: number) => {
		setContainerCounts(prev => ({
			...prev,
			[containerTypeId]: count,
		}));
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			console.log('🚀 Starting dispatch update...');

			// Generate inventory payload
			const inventoryPayload = {
				containers: Object.entries(containerCounts)
					.filter(([_, count]) => count > 0)
					.map(([containerTypeId, count]) => ({
						id: recordIds[parseInt(containerTypeId)] || null, // Include record ID if available
						client_id: Number(clientLocationId),
						container_type_id: parseInt(containerTypeId),
						count,
						facility_id: Number(facilityId),
					})),
			};

			console.log('📦 Calling update API...', inventoryPayload);

			// Call the update API
			const response = await TransitPlanApi.updateB2BInventory(inventoryPayload);
			console.log('📦 Update API response:', response);

			if (!response || response.status_code !== 200) {
				throw new Error(response?.message || 'Failed to update inventory - no response received');
			}

			// Clear localStorage after successful submission
			clearLocalStorage();
			console.log('🗑️ Cleared localStorage after successful submission');

			setSnackbar({
				open: true,
				message: response.message || 'Inventory updated successfully',
				type: 'success',
			});

			// Navigate back to listing after a short delay
			setTimeout(() => {
				navigate('/transit-plan/sent/inventory');
			}, 1500);
		} catch (error) {
			console.error('❌ Error during dispatch update:', error);
			setSnackbar({
				open: true,
				message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	if (loading || loadingExistingData) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-lg text-gray-600'>Loading dispatch details...</div>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title={`Edit Dispatch - ${clientName}`}
				locationName={user?.city_id === 3 ? 'Mumbai' : 'City'}
				totalItems={skuMapData.length}
				itemType='container types'
				icon='📦'
			/>

			<div className='max-w-7xl mx-auto'>
				<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
					<ContainerTypesSection
						skuMapData={skuMapData}
						containerCounts={containerCounts}
						onContainerCountChange={handleContainerCountChange}
					/>

					{/* Dispatch details section commented out - not editable in edit mode */}
					{/* <DispatchFormSection
						adhocTransportation={adhocTransportation}
						onAdhocTransportationChange={setAdhocTransportation}
						dispatchVehicleNumber={dispatchVehicleNumber}
						onDispatchVehicleNumberChange={setDispatchVehicleNumber}
						signatureName={signatureName}
						onSignatureNameChange={setSignatureName}
						photograph={photograph}
						imageUrl={imageUrl}
						fileBase64={fileBase64}
						uploadingImage={uploadingImage}
						uploadedImageUrl={uploadedImageUrl}
						onFileUpload={handleFileUpload}
					/> */}
				</div>

				{/* Submit Button */}
				<div className='flex justify-end space-x-4 mt-6'>
					<Button
						variant='outline'
						onClick={() => navigate('/transit-plan/sent/inventory')}
						className='px-6 py-2'
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={submitting}
						className='px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
					>
						{submitting ? 'Updating...' : 'Update'}
					</Button>
				</div>
			</div>

			{/* Snackbar */}
			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</>
	);
};

export default EditSentInventoryDetails;

