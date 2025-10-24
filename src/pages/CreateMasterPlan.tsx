import React, { useState } from 'react';
import { Button, Snackbar } from '../components/ui';
import { MasterPlanForm } from '../components/MasterPlanForm';
import { TransitSection } from '../components/TransitSection';
import { useMasterPlanData } from '../hooks/useMasterPlanData';
import { TransitPlanApi } from '../services/transitPlanApi';

const CreateMasterPlan: React.FC = () => {
	const [submitting, setSubmitting] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		type: 'success' as 'success' | 'error' | 'info',
	});

	const {
		loading,
		facilities,
		clients,
		vehicles,
		transitTypes,
		data,
		updateData,
		addTransit,
		removeTransit,
		updateTransit,
		isFormValid,
		getSubmitPayload,
		clearSavedData,
	} = useMasterPlanData();

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-lg text-gray-600'>Loading...</div>
			</div>
		);
	}

	const dispatchType = transitTypes.find(t => t.name?.toLowerCase().includes('dispatch'));
	const pickupType = transitTypes.find(t => t.name?.toLowerCase().includes('pickup'));

	const handleSubmit = async () => {
		console.log('🚀 Submit button clicked');
		console.log('📋 Form valid:', isFormValid());
		console.log('📊 Current data:', data);

		if (!isFormValid()) {
			console.log('❌ Form validation failed');
			setSnackbar({
				open: true,
				message: 'Please fill in all required fields',
				type: 'error',
			});
			return;
		}

		setSubmitting(true);
		console.log('🔄 Starting submission...');

		try {
			const payload = getSubmitPayload();
			console.log('📤 Submitting Master Plan Payload:', payload);

			const response = await TransitPlanApi.createMasterPlan(payload);
			console.log('📥 API Response:', response);

			if (response.status_code === 200 || response.status === 'success') {
				setSnackbar({
					open: true,
					message: 'Master Plan created successfully!',
					type: 'success',
				});
				clearSavedData(); // Clear the form after successful submission
			} else {
				setSnackbar({
					open: true,
					message: response.message || 'Failed to create master plan',
					type: 'error',
				});
			}
		} catch (error: unknown) {
			console.error('❌ Error creating master plan:', error);
			setSnackbar({
				open: true,
				message:
					(error as any)?.response?.data?.message ||
					(error as Error)?.message ||
					'An error occurred while creating the master plan',
				type: 'error',
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='min-h-screen bg-white p-6'>
			<div className='max-w-[1920px] mx-auto  flex flex-col gap-6'>
				<MasterPlanForm
					facilities={facilities}
					clients={clients}
					facilityId={data.facilityId}
					clientId={data.clientId}
					onFacilityChange={value => updateData({ facilityId: value })}
					onClientChange={value => updateData({ clientId: value })}
				/>

				<div className='shadow-lg rounded-lg p-4 bg-white'>
					<TransitSection
						type='dispatch'
						transits={data.dispatchTransits}
						label={dispatchType?.name || 'Dispatch'}
						vehicles={vehicles}
						onAdd={() => addTransit('dispatch')}
						onRemove={id => removeTransit('dispatch', id)}
						onUpdate={(id, field, value) => updateTransit('dispatch', id, field, value)}
					/>
				</div>

				<div className='shadow-lg rounded-lg p-4 bg-white'>
					<TransitSection
						type='pickup'
						transits={data.pickupTransits}
						label={pickupType?.name || 'Pickup'}
						vehicles={vehicles}
						onAdd={() => addTransit('pickup')}
						onRemove={id => removeTransit('pickup', id)}
						onUpdate={(id, field, value) => updateTransit('pickup', id, field, value)}
					/>
				</div>

				{/* Summary and Submit */}
				<div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
					<div className='flex items-center justify-between'>
						<div className='text-sm text-gray-600'>
							<p>Dispatch Entries: {data.dispatchTransits.length}</p>
							<p>Pickup Entries: {data.pickupTransits.length}</p>
						</div>
						<Button
							onClick={handleSubmit}
							disabled={!isFormValid() || submitting}
							className={`px-6 py-2 rounded-md font-medium ${
								isFormValid() && !submitting
									? 'bg-green-600 text-white hover:bg-green-700'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
							}`}
						>
							{submitting ? 'Creating...' : 'Create Master Plan'}
						</Button>
					</div>
				</div>
			</div>

			{/* Snackbar */}
			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => {
					console.log('🍞 Snackbar onClose called');
					setSnackbar(prev => ({ ...prev, open: false }));
				}}
			/>
		</div>
	);
};

export default CreateMasterPlan;
