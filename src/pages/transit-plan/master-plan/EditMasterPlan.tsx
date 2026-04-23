import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import {
	clearEditMasterPlanData,
	updateEditMasterPlanData,
	setEditMasterPlanData,
} from '../../../store/slices/transitPlanSlice';
import { PageHeader, Button, Snackbar } from '../../../components/ui';
import { TransitSection } from '../../../components/TransitSection';
import { TransitPlanApi } from '../../../services/transitPlanApi';
import { CommonApiService, VehicleOption } from '../../../services/commonApi';
import { useNavigate } from 'react-router-dom';

const EditMasterPlan: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { editMasterPlanData } = useSelector((state: RootState) => state.transitPlan);
	const [submitting, setSubmitting] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});
	const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

	// Fetch vehicles data and restore edit data from localStorage
	// Load vehicles once on mount
	useEffect(() => {
		const loadVehicles = async () => {
			try {
				const vehiclesRes = await CommonApiService.getVehicles();
				setVehicles(vehiclesRes.data || []);
			} catch (error) {
				console.error('Error loading vehicles:', error);
			}
		};
		loadVehicles();
	}, []); // Only run once on mount

	// Restore edit data from localStorage if Redux is empty
	useEffect(() => {
		if (!editMasterPlanData) {
			const savedData = localStorage.getItem('editMasterPlanData');
			if (savedData) {
				try {
					const parsedData = JSON.parse(savedData);
					dispatch(setEditMasterPlanData(parsedData));
				} catch (error) {
					console.error('Error parsing saved edit data:', error);
				}
			}
		}
	}, [dispatch, editMasterPlanData]);

	// Save edit data to localStorage whenever it changes
	useEffect(() => {
		if (editMasterPlanData) {
			localStorage.setItem('editMasterPlanData', JSON.stringify(editMasterPlanData));
		}
	}, [editMasterPlanData]);

	// No local state needed - update Redux directly

	// Memoize the update callback
	const handleUpdateCallback = useCallback(
		(id: string, field: string, value: string | number | number[]) => {
			console.log('🔄 Update callback called:', { id, field, value });
			if (field === 'vehicleType') {
				// When vehicle type changes, update vehicle_id, driver_name, and driver_phone
				const selectedVehicle = vehicles.find(v => String(v.id) === String(value));
				console.log('🚗 Selected vehicle:', selectedVehicle);
				if (selectedVehicle) {
					dispatch(updateEditMasterPlanData({ field: 'vehicle_id', value: selectedVehicle.id }));
					dispatch(
						updateEditMasterPlanData({ field: 'driver_name', value: selectedVehicle.driver_name })
					);
					dispatch(
						updateEditMasterPlanData({ field: 'driver_phone', value: selectedVehicle.driver_phone })
					);
				}
			} else if (field === 'days') {
				// Handle days field directly - no vehicle lookup needed
				console.log('📝 Updating days:', value);
				dispatch(updateEditMasterPlanData({ field: 'days', value }));
			} else {
				// Map other field names from TransitEntry to Redux field names
				const fieldMapping: Record<string, string> = {
					date: 'transit_date',
					time: 'transit_time',
				};
				const reduxField = fieldMapping[field] || field;
				console.log('📝 Updating field:', { field, reduxField, value });
				dispatch(updateEditMasterPlanData({ field: reduxField, value }));
			}
		},
		[dispatch, vehicles] // vehicles needed for vehicleType field lookup
	);

	if (!editMasterPlanData) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<h2 className='text-xl font-semibold text-gray-900 mb-2'>No Master Plan Data</h2>
					<p className='text-gray-600 mb-4'>
						Please select a master plan to edit from the listing page.
					</p>
					<Button
						onClick={() => navigate('/transit-plan/master-plan/listing')}
						className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700'
					>
						Go to Listing
					</Button>
				</div>
			</div>
		);
	}

	// Time conversion function
	const convertTimeFormat = (time12hr: string): string => {
		if (!time12hr) return editMasterPlanData.transit_time;

		// If already in 24-hour format, return as-is
		if (time12hr.includes(':') && !time12hr.includes(' ')) {
			return time12hr.includes(':00') ? time12hr : `${time12hr}:00`;
		}

		const [time, period] = time12hr.split(' ');
		let [hours, minutes] = time.split(':').map(Number);

		if (period?.toLowerCase() === 'pm' && hours < 12) {
			hours += 12;
		} else if (period?.toLowerCase() === 'am' && hours === 12) {
			hours = 0;
		}

		const formattedHours = String(hours).padStart(2, '0');
		const formattedMinutes = String(minutes).padStart(2, '0');

		return `${formattedHours}:${formattedMinutes}:00`;
	};

	// Handle update
	const handleUpdate = async () => {
		setSubmitting(true);
		try {
			const payload: any = {
				id: editMasterPlanData.id,
				vehicleId: editMasterPlanData.vehicle_id!,
				driverName: editMasterPlanData.driver_name,
				driverPhone: editMasterPlanData.driver_phone,
				restaurantId: editMasterPlanData.restaurant_id!,
				cityId: String(editMasterPlanData.city_id!),
				transitTypeId: editMasterPlanData.transit_type_id!,
				transitDate: editMasterPlanData.transit_date,
				transitTime: convertTimeFormat(editMasterPlanData.transit_time),
				facilityId: editMasterPlanData.facility_id!,
			};

			// Add days if they exist
			if ((editMasterPlanData as any).days && (editMasterPlanData as any).days.length > 0) {
				payload.days = (editMasterPlanData as any).days;
			}

			console.log('Update payload:', payload);
			console.log('Current Redux state:', editMasterPlanData);
			const response = await TransitPlanApi.updateMasterPlan(payload);
			console.log('Update response:', response);

			setSnackbar({
				open: true,
				message: 'Master Plan updated successfully!',
				type: 'success',
			});

			// Clear Redux and navigate back
			setTimeout(() => {
				dispatch(clearEditMasterPlanData());
				localStorage.removeItem('editMasterPlanData');
				navigate('/transit-plan/master-plan/listing');
			}, 1500);
		} catch (error: unknown) {
			console.error('Update error:', error);
			const errorMessage =
				error instanceof Error && 'response' in error
					? (error as any).response?.data?.message || 'Failed to update master plan'
					: 'Failed to update master plan';
			setSnackbar({
				open: true,
				message: errorMessage,
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	const transitType = editMasterPlanData.type || 'Unknown';

	const transitEntry = {
		id: '1',
		date: editMasterPlanData.transit_date,
		time: editMasterPlanData.transit_time,
		vehicleType: String(editMasterPlanData.vehicle_id),
		days: (editMasterPlanData as any).days || [],
	};

	return (
		<div className='min-h-screen bg-white p-6'>
			<div className='max-w-6xl mx-auto'>
			<PageHeader title='Edit Master Plan' totalItems={0} itemType='master plans' />

				{/* Display using same components as Create */}
			<TransitSection
				type={transitType.toLowerCase().includes('dispatch') ? 'dispatch' : 'pickup'}
				transits={[transitEntry]}
				label={transitType}
				vehicles={vehicles}
					onAdd={() => {
						// No-op: Edit mode doesn't support adding new entries
					}}
					onRemove={() => {
						// No-op: Edit mode doesn't support removing entries
					}}
					onUpdate={handleUpdateCallback}
				/>

				{/* Update Button */}
				<div className='flex justify-end gap-4 mt-6'>
					<Button
						onClick={() => {
							dispatch(clearEditMasterPlanData());
							localStorage.removeItem('editMasterPlanData');
							navigate('/transit-plan/master-plan/listing');
						}}
						className='px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
					>
						Cancel
					</Button>
					<Button
						onClick={handleUpdate}
						disabled={submitting}
						className={`px-6 py-2 rounded-md font-medium ${
							submitting
								? 'bg-gray-300 text-gray-500 cursor-not-allowed'
								: 'bg-green-600 text-white hover:bg-green-700'
						}`}
					>
						{submitting ? 'Updating...' : 'Update Master Plan'}
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
		</div>
	);
};

export default EditMasterPlan;
