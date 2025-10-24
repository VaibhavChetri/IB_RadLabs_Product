import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Button, PageHeader, Snackbar } from '../components/ui';
import { TransitPlanApi, ClientSkuMapItem } from '../services/transitPlanApi';
import ContainerTypesSection from '../components/ContainerTypesSection';
import DispatchFormSection from '../components/DispatchFormSection';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFileUpload } from '../hooks/useFileUpload';

const ClientDispatchDetails: React.FC = () => {
	const { clientLocationId, facilityId } = useParams<{
		clientLocationId: string;
		facilityId: string;
	}>();

	const location = useLocation();
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);

	// Component state
	const [clientName, setClientName] = useState<string>('');
	const [clientId, setClientId] = useState<number | null>(null);
	const [transitPlanRow, setTransitPlanRow] = useState<any>(null);
	const [skuMapData, setSkuMapData] = useState<ClientSkuMapItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Form state
	const [adhocTransportation, setAdhocTransportation] = useState(false);
	const [dispatchVehicleNumber, setDispatchVehicleNumber] = useState('');
	const [signatureName, setSignatureName] = useState('');
	const [containerCounts, setContainerCounts] = useState<Record<number, number>>({});

	// Local storage key for this client
	const storageKey = `client-details-${clientLocationId}-${facilityId}`;

	// Custom hooks
	const { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } =
		useLocalStorage(storageKey);
	const { photograph, imageUrl, fileBase64, uploadedImageUrl, uploadingImage, handleFileUpload } =
		useFileUpload();

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
			uploadedImageUrl,
			fileBase64,
			photographName: photograph?.name,
		});
	}, [
		adhocTransportation,
		dispatchVehicleNumber,
		signatureName,
		containerCounts,
		uploadedImageUrl,
		fileBase64,
		photograph,
		saveToLocalStorage,
	]);

	// Initialize data from navigation state and localStorage
	useEffect(() => {
		if (location.state) {
			const {
				clientName: name,
				clientId: id,
				transitPlanRow: row,
			} = location.state as {
				clientName: string;
				clientId: number;
				transitPlanRow: any;
			};

			console.log('🔍 Navigation state:', { name, id, row });
			setClientName(name);
			setClientId(id);
			setTransitPlanRow(row);

			// Load saved data from localStorage
			const savedData = loadFromLocalStorage();
			if (savedData) {
				console.log('🔄 Setting form values from localStorage');
				setAdhocTransportation(savedData.adhocTransportation || false);
				setDispatchVehicleNumber(savedData.dispatchVehicleNumber || '');
				setSignatureName(savedData.signatureName || '');
				setContainerCounts(savedData.containerCounts || {});
			} else {
				// If no saved data, use default signature name
				const firstName = user?.name?.split(' ')[0] || '';
				setSignatureName(firstName);
				console.log('👤 Setting default signature name:', firstName);
			}
		} else {
			// Handle page refresh scenario - redirect back to listing
			console.log('⚠️ No navigation state found, redirecting to listing page');
			navigate('/transit-plan/sent/plan');
		}
	}, [location.state, user?.name, loadFromLocalStorage, navigate]);

	// Fetch SKU map data
	useEffect(() => {
		const fetchSkuMapData = async () => {
			if (!transitPlanRow?.clientLocationId || !transitPlanRow?.facilityId) return;

			setLoading(true);
			try {
				console.log(
					'🔍 Fetching SKU map for clientLocationId:',
					transitPlanRow.clientLocationId,
					'facilityId:',
					transitPlanRow.facilityId
				);
				const data = await TransitPlanApi.getClientSkuMap(
					transitPlanRow.clientLocationId,
					transitPlanRow.facilityId
				);
				console.log('🔍 SKU map data received:', data);
				setSkuMapData(data);

				// Get current container counts from localStorage to avoid stale state
				const savedData = loadFromLocalStorage();
				let savedCounts: Record<number, number> = {};

				if (savedData?.containerCounts) {
					savedCounts = savedData.containerCounts;
					console.log('📦 Using saved container counts from localStorage:', savedCounts);
				}

				// Merge saved counts with new container types
				const mergedCounts = { ...savedCounts };
				data.forEach(item => {
					if (!(item.containerTypeId in mergedCounts)) {
						mergedCounts[item.containerTypeId] = 0;
					}
				});

				console.log('🔄 Final merged container counts:', mergedCounts);
				setContainerCounts(mergedCounts);
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
	}, [transitPlanRow, loadFromLocalStorage]);

	// Auto-save when form data changes
	useEffect(() => {
		if (clientLocationId && facilityId && clientName) {
			autoSave();
		}
	}, [clientLocationId, facilityId, clientName, autoSave]);

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
			console.log('🚀 Starting dispatch submission...');

			// Generate inventory payload
			const inventoryPayload = {
				clientId: clientId!,
				facilityId: transitPlanRow.facilityId,
				adhocTransportation,
				dispatchVehicleNumber,
				signatureName,
				containerTypes: Object.entries(containerCounts).map(([id, count]) => ({
					containerTypeId: parseInt(id),
					count,
				})),
				loadedVehiclePic: uploadedImageUrl ? [{ path: uploadedImageUrl }] : [],
			};

			console.log('📦 Calling sendB2BInventory API...', inventoryPayload);
			const inventoryResponse = await TransitPlanApi.sendB2BInventory(inventoryPayload);
			console.log('📦 sendB2BInventory response:', inventoryResponse);

			if (inventoryResponse.status_code !== 200) {
				throw new Error(inventoryResponse.message || 'Failed to send inventory');
			}

			// Generate transit plan payload
			const initiateTransitPayload = {
				id: transitPlanRow.id,
				dispatchVehicleNumber,
				signatureName,
				loadedVehiclePic: uploadedImageUrl ? [{ path: uploadedImageUrl }] : [],
				pickupImages: null,
				containerTypes: [],
			};

			console.log('🚛 Calling initiateTransitPlan API...', initiateTransitPayload);
			const transitResponse = await TransitPlanApi.initiateTransitPlan(initiateTransitPayload);
			console.log('🚛 initiateTransitPlan response:', transitResponse);

			if (transitResponse.status_code !== 200) {
				throw new Error(transitResponse.message || 'Failed to initiate transit plan');
			}

			// Clear localStorage after successful submission
			clearLocalStorage();
			console.log('🗑️ Cleared localStorage after successful submission');

			setSnackbar({
				open: true,
				message: `Dispatch completed successfully! DC Number: ${inventoryResponse.dc_number}`,
				type: 'success',
			});

			// Navigate back to listing after a short delay
			setTimeout(() => {
				navigate('/transit-plan/sent/plan');
			}, 2000);
		} catch (error) {
			console.error('❌ Error during dispatch submission:', error);
			setSnackbar({
				open: true,
				message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-lg text-gray-600'>Loading client details...</div>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title={`Client Details - ${clientName}`}
				locationName={user?.city_id === 3 ? 'Mumbai' : 'City'}
				totalItems={skuMapData.length}
				itemType='container types'
				icon='📦'
			/>

			<div className='max-w-7xl mx-auto'>
				<div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
					<ContainerTypesSection
						skuMapData={skuMapData}
						containerCounts={containerCounts}
						onContainerCountChange={handleContainerCountChange}
					/>

					<DispatchFormSection
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
					/>
				</div>

				{/* Submit Button */}
				<div className='flex justify-end space-x-4 mt-6'>
					<Button
						variant='outline'
						onClick={() => navigate('/transit-plan/sent/plan')}
						className='px-6 py-2'
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={submitting}
						className='px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
					>
						{submitting ? 'Submitting...' : 'Submit'}
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

export default ClientDispatchDetails;
