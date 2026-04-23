import React from 'react';
import { FloatingDropdown } from '../../../components/ui/FloatingDropdown';

interface Client {
	clientId: number;
	clientName: string;
}

interface SkuListingFiltersProps {
	clients: Client[];
	selectedClientId: number | null;
	selectedStatus: string;
	onClientChange: (clientId: string) => void;
	onStatusChange: (status: string) => void;
}

export const SkuListingFilters: React.FC<SkuListingFiltersProps> = ({
	clients,
	selectedClientId,
	selectedStatus,
	onClientChange,
	onStatusChange,
}) => {
	return (
		<div className='bg-background rounded-lg border border-border p-4 mb-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<FloatingDropdown
					label='Select Client'
					placeholder='Choose a client'
					value={selectedClientId?.toString() || ''}
					onChange={onClientChange}
					options={clients.map(client => ({
						value: client.clientId.toString(),
						label: client.clientName,
					}))}
				/>
				<FloatingDropdown
					label='Status'
					placeholder='Filter by status'
					value={selectedStatus}
					onChange={onStatusChange}
					options={[
						{ value: '', label: 'All' },
						{ value: 'Enabled', label: 'Enabled' },
						{ value: 'Disabled', label: 'Disabled' },
					]}
				/>
			</div>
		</div>
	);
};

