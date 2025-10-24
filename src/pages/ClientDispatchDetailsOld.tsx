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

	const [clientName, setClientName] = useState<string>('');
	const [clientId, setClientId] = useState<number>(0);
	const [transitPlanRow, setTransitPlanRow] = useState<any>(null); // Store the full row object
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
	const { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } = useLocalStorage(storageKey);
	const {
		photograph,
		imageUrl,
		localPreviewUrl,
		fileBase64,
		uploadedImageUrl,
		uploadingImage,
		handleFileUpload,
		resetFileUpload,
	} = useFileUpload();

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

	// Load data from localStorage
	const loadFromLocalStorage = React.useCallback(() => {
		try {
			console.log('🔍 Looking for localStorage key:', storageKey);
			const savedData = localStorage.getItem(storageKey);
			console.log('🔍 Raw saved data:', savedData);

			if (savedData) {
				const parsed = JSON.parse(savedData);
				console.log('📂 Parsed localStorage data:', parsed);

				console.log('🔄 Setting form values from localStorage:');
				console.log('  - adhocTransportation:', parsed.adhocTransportation);
				console.log('  - dispatchVehicleNumber:', parsed.dispatchVehicleNumber);
				console.log('  - signatureName:', parsed.signatureName);
				console.log('  - containerCounts:', parsed.containerCounts);

				setAdhocTransportation(parsed.adhocTransportation || false);
				setDispatchVehicleNumber(parsed.dispatchVehicleNumber || '');
				setSignatureName(parsed.signatureName || '');
				setContainerCounts(parsed.containerCounts || {});
				setUploadedImageUrl(parsed.uploadedImageUrl || '');

				if (parsed.photographName) {
					// Create a mock file object for display purposes
					const mockFile = new File([''], parsed.photographName, {
						type: parsed.photographName.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg',
					});
					setPhotograph(mockFile);
					console.log('📸 Restored photograph file:', parsed.photographName);
				}

				// Set image preview - prioritize base64 for true local preview
				if (parsed.fileBase64) {
					setImageUrl(parsed.fileBase64);
					setFileBase64(parsed.fileBase64);
					console.log('🖼️ Restored local image preview from base64');
				} else if (parsed.uploadedImageUrl) {
					setImageUrl(parsed.uploadedImageUrl);
					console.log('🖼️ Fallback to uploaded image URL:', parsed.uploadedImageUrl);
				}

				console.log('✅ Successfully loaded from localStorage');
				return true;
			} else {
				console.log('❌ No data found in localStorage for key:', storageKey);
			}
		} catch (error) {
			console.error('❌ Error loading from localStorage:', error);
		}
		return false;
	}, [storageKey]);

	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

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
			setClientName(name);
			setClientId(id);
			setTransitPlanRow(row);

			console.log('📋 Transit Plan Row received:', row);

			// Try to load from localStorage first
			const loadedFromStorage = loadFromLocalStorage();

			// If no saved data, use default signature name
			if (!loadedFromStorage) {
				const firstName = user?.name?.split(' ')[0] || '';
				setSignatureName(firstName);
				console.log('👤 Setting default signature name:', firstName);
			}
		} else {
			// Handle page refresh scenario - redirect back to listing
			console.log('⚠️ No navigation state found, redirecting to listing page');
			navigate('/transit-plan/sent/plan');
		}
	}, [location.state, user?.name, storageKey, loadFromLocalStorage, navigate]);

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
				const savedData = localStorage.getItem(storageKey);
				let savedCounts: Record<number, number> = {};

				if (savedData) {
					try {
						const parsed = JSON.parse(savedData);
						savedCounts = parsed.containerCounts || {};
						console.log('📦 Using saved container counts from localStorage:', savedCounts);
					} catch (error) {
						console.error('❌ Error parsing saved container counts:', error);
					}
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
	}, [transitPlanRow, storageKey]);

	// Cleanup local preview URL when component unmounts
	useEffect(() => {
		return () => {
			if (localPreviewUrl) {
				URL.revokeObjectURL(localPreviewUrl);
			}
		};
	}, []); // Only run on unmount

	// Auto-save when form data changes (but not on initial load)
	useEffect(() => {
		if (clientLocationId && facilityId && clientName) {
			saveToLocalStorage();
		}
	}, [
		clientLocationId,
		facilityId,
		clientName,
		storageKey,
		saveToLocalStorage,
		adhocTransportation,
		dispatchVehicleNumber,
		signatureName,
		containerCounts,
		uploadedImageUrl,
		fileBase64,
		photograph,
	]);

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		console.log('📁 File input changed:', event.target.files);
		const file = event.target.files?.[0];
		if (file) {
			console.log('📁 File selected:', file.name, file.size, file.type);
			setPhotograph(file);

			// Create local preview URL immediately
			const newLocalPreviewUrl = URL.createObjectURL(file);
			console.log('🖼️ Created new local preview URL:', newLocalPreviewUrl);
			setLocalPreviewUrl(newLocalPreviewUrl);
			setImageUrl(newLocalPreviewUrl);
			console.log('🖼️ Set imageUrl to:', newLocalPreviewUrl);

			// Convert file to base64 for persistent local storage
			const reader = new FileReader();
			reader.onload = e => {
				const base64 = e.target?.result as string;
				setFileBase64(base64);
				console.log('📁 Converted file to base64, length:', base64.length);
			};
			reader.readAsDataURL(file);

			setUploadingImage(true);

			try {
				console.log('📸 Uploading image immediately...');
				const imageResponse = await TransitPlanApi.uploadImage(file);
				console.log('📸 Full image upload response:', imageResponse);
				console.log('📸 Response keys:', Object.keys(imageResponse));

				// Debug the response structure
				if (imageResponse.data) {
					console.log('📸 imageResponse.data exists:', imageResponse.data);
					console.log('📸 imageResponse.data.imgLocation:', imageResponse.data.imgLocation);
				} else {
					console.log('📸 imageResponse.data is undefined');
					console.log('📸 imageResponse structure:', JSON.stringify(imageResponse, null, 2));
				}

				// Try to extract the image URL safely
				let uploadedImageUrl = '';
				if (
					imageResponse.data &&
					imageResponse.data.imgLocation &&
					imageResponse.data.imgLocation[0]
				) {
					uploadedImageUrl = imageResponse.data.imgLocation[0];
				} else {
					throw new Error('Could not find imgLocation in response');
				}

				console.log('📸 Image URL extracted:', uploadedImageUrl);

				// Store uploaded image URL but keep showing local preview
				setUploadedImageUrl(uploadedImageUrl);
				setSnackbar({
					open: true,
					message: `Image uploaded successfully!`,
					type: 'success',
				});
			} catch (error) {
				console.error('❌ Image upload error:', error);
				setSnackbar({
					open: true,
					message: `Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
					type: 'error',
				});
			} finally {
				setUploadingImage(false);
			}
		} else {
			console.log('📁 No file selected');
		}
	};

	const handleContainerCountChange = (containerTypeId: number, count: number) => {
		setContainerCounts(prev => ({
			...prev,
			[containerTypeId]: count,
		}));
	};

	const handleTestApi = () => {
		if (!transitPlanRow) {
			console.log('❌ No transit plan row data available');
			return;
		}

		// Generate payload for API 1: sendB2BInventory
		const containersPayload = Object.entries(containerCounts)
			.filter(([_, count]) => count > 0)
			.map(([containerTypeId, count]) => ({
				container_type_id: parseInt(containerTypeId),
				count: count,
			}));

		const sendB2BPayload = {
			containers: containersPayload,
			facility_id: transitPlanRow.facilityId,
			transit_date: transitPlanRow.transitDate,
			client_location_id: transitPlanRow.clientLocationId,
			transit_id: transitPlanRow.transit_id,
			adhoc: adhocTransportation ? 1 : 0,
		};

		// Generate payload for API 2: initiateTransitPlan
		const initiateTransitPayload = {
			transitId: transitPlanRow.id,
			vehicleNumber: dispatchVehicleNumber,
			signatureName: signatureName,
			dispatchConditionIds: '',
			dispatchImages: {
				challanPic: [],
				signaturePic: '',
				loadedVehiclePic: uploadedImageUrl ? [{ path: uploadedImageUrl }] : [],
			},
			pickupImages: null,
			containerTypes: [],
		};

		console.log('🧪 TEST API PAYLOADS:');
		console.log('📦 API 1 - sendB2BInventory:', sendB2BPayload);
		console.log('🚛 API 2 - initiateTransitPlan:', initiateTransitPayload);
		console.log('📋 Transit Plan Row:', transitPlanRow);
		console.log('📊 Container Counts:', containerCounts);
		console.log('🖼️ Uploaded Image URL:', uploadedImageUrl);
	};

	const handleSubmit = async () => {
		if (!transitPlanRow) {
			setSnackbar({
				open: true,
				message: 'No transit plan data available',
				type: 'error',
			});
			return;
		}

		setSubmitting(true);
		try {
			console.log('🚀 Starting dispatch submission...');

			// Generate payload for API 1: sendB2BInventory
			const containersPayload = Object.entries(containerCounts)
				.filter(([_, count]) => count > 0)
				.map(([containerTypeId, count]) => ({
					container_type_id: parseInt(containerTypeId),
					count: count,
				}));

			const sendB2BPayload = {
				containers: containersPayload,
				facility_id: transitPlanRow.facilityId,
				transit_date: transitPlanRow.transitDate,
				client_location_id: transitPlanRow.clientLocationId,
				transit_id: transitPlanRow.transit_id,
				adhoc: adhocTransportation ? 1 : 0,
			};

			console.log('📦 Calling sendB2BInventory API...', sendB2BPayload);
			const inventoryResponse = await TransitPlanApi.sendB2BInventory(sendB2BPayload);
			console.log('📦 sendB2BInventory response:', inventoryResponse);
			console.log('📦 inventoryResponse.status_code:', inventoryResponse.status_code);
			console.log('📦 inventoryResponse.status:', inventoryResponse.status);

			if (inventoryResponse.status_code !== 200) {
				throw new Error(inventoryResponse.message || 'Failed to send inventory');
			}

			// Generate payload for API 2: initiateTransitPlan
			console.log('🔍 Debug transitPlanRow:', transitPlanRow);
			console.log('🔍 Debug transitPlanRow.id:', transitPlanRow.id);
			console.log('🔍 Debug dispatchVehicleNumber:', dispatchVehicleNumber);
			console.log('🔍 Debug signatureName:', signatureName);
			console.log('🔍 Debug uploadedImageUrl:', uploadedImageUrl);

			const initiateTransitPayload = {
				transitId: transitPlanRow.id,
				vehicleNumber: dispatchVehicleNumber,
				signatureName: signatureName,
				dispatchConditionIds: '',
				dispatchImages: {
					challanPic: [],
					signaturePic: '',
					loadedVehiclePic: uploadedImageUrl ? [{ path: uploadedImageUrl }] : [],
				},
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
			localStorage.removeItem(storageKey);
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
					{/* Container Types Section - 40% */}
					<div className='lg:col-span-2'>
						<div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
							<h2 className='text-xl font-semibold text-gray-900 mb-6'>📦 Container Types</h2>
							<div className='grid grid-cols-1 gap-4'>
								{skuMapData.map(item => (
									<div key={item.containerTypeId}>
										<FloatingInput
											label={item.containerType}
											type='number'
											value={containerCounts[item.containerTypeId]?.toString() || ''}
											onChange={value =>
												handleContainerCountChange(item.containerTypeId, parseInt(value) || 0)
											}
											placeholder='0'
											className='w-full'
										/>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Form Section - 60% */}
					<div className='lg:col-span-3'>
						<div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
							<h2 className='text-xl font-semibold text-gray-900 mb-4'>Dispatch Details</h2>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* Adhoc Transportation Toggle */}
								<div className='md:col-span-2'>
									<label className='flex items-center space-x-3'>
										<input
											type='checkbox'
											checked={adhocTransportation}
											onChange={e => setAdhocTransportation(e.target.checked)}
											className='w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
										/>
										<span className='text-sm font-medium text-gray-700'>Adhoc Transportation</span>
									</label>
								</div>

								{/* Dispatch Vehicle Number */}
								<div>
									<FloatingInput
										label='Dispatch Vehicle Number*'
										type='text'
										value={dispatchVehicleNumber}
										onChange={setDispatchVehicleNumber}
										placeholder='Enter vehicle number'
									/>
								</div>

								{/* Signature Name */}
								<div>
									<FloatingInput
										label='Signature Name'
										type='text'
										value={signatureName}
										onChange={setSignatureName}
										placeholder='Enter signature name'
									/>
								</div>

								{/* Photograph Upload */}
								<div className='md:col-span-2'>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Photo After Loading Containers Into Vehicle
									</label>
									<div className='flex gap-2'>
										{/* Take Picture Button */}
										<div className='relative flex-1'>
											<input
												type='file'
												accept='image/*'
												capture='environment'
												onChange={handleFileUpload}
												disabled={uploadingImage}
												className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
											/>
											<div className='flex items-center justify-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors'>
												<span className='text-sm font-medium text-green-600'>📸 Take Picture</span>
											</div>
										</div>

										{/* Choose File Button */}
										<div className='relative flex-1'>
											<input
												type='file'
												accept='image/*'
												onChange={handleFileUpload}
												disabled={uploadingImage}
												className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
											/>
											<div className='flex items-center justify-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors'>
												<span className='text-sm font-medium text-blue-600'>📁 Choose File</span>
											</div>
										</div>
									</div>
									{uploadingImage && (
										<p className='mt-2 text-sm text-blue-600'>📸 Uploading image...</p>
									)}
									{photograph && !uploadingImage && (
										<p className='mt-2 text-sm text-gray-600'>
											Selected: {photograph.name}
											{uploadedImageUrl && <span className='ml-2 text-green-600'>✅ Uploaded</span>}
										</p>
									)}
									{!photograph && uploadedImageUrl && !uploadingImage && (
										<p className='mt-2 text-sm text-green-600'>
											📸 Image uploaded: {uploadedImageUrl.split('/').pop()}
										</p>
									)}
									{imageUrl && (
										<div className='mt-4'>
											<p className='text-sm font-medium text-gray-700 mb-2'>
												{uploadingImage ? '📸 Uploading...' : '✅ Preview:'}
											</p>
											<div className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
												{/* Show file info for debugging */}
												<div className='text-xs text-gray-500 mb-2'>
													File: {photograph?.name} | Type: {photograph?.type}
													{photograph?.size && photograph.size > 0 && (
														<> | Size: {photograph.size} bytes</>
													)}
												</div>

												{photograph?.type === 'image/svg+xml' ? (
													<div
														className='max-w-full h-48 flex items-center justify-center'
														dangerouslySetInnerHTML={{
															__html: fileBase64
																? DOMPurify.sanitize(
																		atob(fileBase64.split(',')[1]).replace(
																			'<svg',
																			'<svg style="max-width: 100%; max-height: 100%; width: auto; height: auto;"'
																		)
																	)
																: 'SVG content not available',
														}}
													/>
												) : (
													<img
														src={imageUrl}
														alt='Container photo preview'
														className='max-w-full h-48 object-contain mx-auto'
														onError={e => {
															console.error('❌ Image load error:', e);
															console.error('❌ Failed URL:', imageUrl);
															console.error('❌ File type:', photograph?.type);
															console.error('❌ File name:', photograph?.name);
															e.currentTarget.style.display = 'none';
															const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
															if (errorDiv) errorDiv.style.display = 'block';
														}}
														onLoad={() => {
															console.log('✅ Image loaded successfully:', imageUrl);
															console.log('✅ File type:', photograph?.type);
														}}
													/>
												)}
												<div className='hidden text-center text-gray-500'>
													<p>⚠️ Image preview not available</p>
													<p className='text-xs'>
														File: {photograph?.name} ({photograph?.type})
													</p>
													<p className='text-xs'>This could be due to:</p>
													<ul className='text-xs text-left mt-2'>
														<li>• CORS policy restrictions</li>
														<li>• Invalid image URL</li>
														<li>• Network connectivity issues</li>
														<li>• Unsupported file format</li>
														<li>• SVG files may not display in some browsers</li>
													</ul>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Submit Button */}
				<div className='flex justify-end space-x-4 mt-6'>
					<Button
						variant='outline'
						onClick={handleTestApi}
						className='px-4 py-2 text-sm bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
					>
						🧪 Test API
					</Button>
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
