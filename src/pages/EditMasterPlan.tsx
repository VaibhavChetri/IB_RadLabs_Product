import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearEditMasterPlanData } from '../store/slices/authSlice';
import { PageHeader, Button, Snackbar } from '../components/ui';
import { MasterPlanForm } from '../components/MasterPlanForm';
import { TransitSection } from '../components/TransitSection';
import { TransitPlanApi } from '../services/transitPlanApi';
import { useNavigate } from 'react-router-dom';

const EditMasterPlan: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { editMasterPlanData } = useSelector((state: RootState) => state.auth);
	const [submitting, setSubmitting] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

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
			return `${time12hr}:00`;
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
			const payload = {
				id: editMasterPlanData.id,
				vehicleId: editMasterPlanData.vehicle_id,
				driverName: editMasterPlanData.driver_name,
				driverPhone: editMasterPlanData.driver_phone,
				restaurantId: editMasterPlanData.restaurant_id,
				cityId: String(editMasterPlanData.city_id),
				transitTypeId: editMasterPlanData.transit_type_id,
				transitDate: editMasterPlanData.transit_date,
				transitTime: convertTimeFormat(editMasterPlanData.transit_time),
				facilityId: editMasterPlanData.facility_id,
			};

			console.log('Update payload:', payload);
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
				navigate('/transit-plan/master-plan/listing');
			}, 1500);
		} catch (error: any) {
			console.error('Update error:', error);
			setSnackbar({
				open: true,
				message: error.response?.data?.message || 'Failed to update master plan',
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	const transitType = editMasterPlanData.type || 'Unknown';
	const isDispatch = transitType.toLowerCase().includes('dispatch');
	const isPickup = transitType.toLowerCase().includes('pickup');

	const transitEntry = {
		id: '1',
		date: editMasterPlanData.transit_date,
		time: editMasterPlanData.transit_time,
		vehicleType: String(editMasterPlanData.vehicle_id),
	};

	return (
		<div className='min-h-screen bg-white p-6'>
			<div className='max-w-6xl mx-auto'>
				<PageHeader
					title='Edit Master Plan'
					infoItems={[
						{
							label: 'Restaurant',
							value: editMasterPlanData.restaurant_name || 'N/A',
							icon: '🏪',
							color: 'bg-green-100',
						},
						{
							label: 'Facility',
							value: editMasterPlanData.facility || 'N/A',
							icon: '🏭',
							color: 'bg-blue-100',
						},
						{
							label: 'Transit Type',
							value: transitType,
							icon: isDispatch ? '🚚' : '📦',
							color: isDispatch ? 'bg-blue-100' : 'bg-green-100',
						},
					]}
				/>

				{/* Display using same components as Create */}
				{isDispatch && (
					<TransitSection
						type='dispatch'
						transits={[transitEntry]}
						label='Dispatch'
						color='bg-blue-100 text-blue-800'
						vehicles={[]}
						onAdd={() => {}}
						onRemove={() => {}}
						onUpdate={() => {}}
					/>
				)}

				{isPickup && (
					<TransitSection
						type='pickup'
						transits={[transitEntry]}
						label='Pickup'
						color='bg-green-100 text-green-800'
						vehicles={[]}
						onAdd={() => {}}
						onRemove={() => {}}
						onUpdate={() => {}}
					/>
				)}

				{/* Update Button */}
				<div className='flex justify-end gap-4 mt-6'>
					<Button
						onClick={() => {
							dispatch(clearEditMasterPlanData());
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
