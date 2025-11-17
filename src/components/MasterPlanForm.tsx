import React from 'react';
import { FloatingDropdown } from './ui';
import { FacilityDropdown } from './FacilityDropdown';
import type { ClientByCityOption } from '../services/commonApi';

interface MasterPlanFormProps {
	clients: ClientByCityOption[];
	facilityId: string;
	clientId: string;
	onFacilityChange: (value: string) => void;
	onClientChange: (value: string) => void;
}

export const MasterPlanForm: React.FC<MasterPlanFormProps> = ({
	clients,
	facilityId,
	clientId,
	onFacilityChange,
	onClientChange,
}) => {
	return (
		<div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6'>
			<h1 className='text-2xl font-bold text-gray-900 mb-6'>Create Master Plan</h1>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<FacilityDropdown
					value={facilityId}
					onChange={onFacilityChange}
					autoSelectFirst={false}
					placeholder='Select Facility'
				/>

				<FloatingDropdown
					label='Client'
					options={clients.map(c => ({
						label: c.clientName || 'Unknown Client',
						value: String(c.clientId),
					}))}
					value={clientId}
					onChange={onClientChange}
					placeholder='Select Client'
				/>
			</div>
		</div>
	);
};
