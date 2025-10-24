import React from 'react';
import { Button, Badge } from './ui';
import { TransitRow } from './TransitRow';
import type { TransitEntry, VehicleOption } from '../hooks/useMasterPlanData';

interface TransitSectionProps {
	type: 'dispatch' | 'pickup';
	transits: TransitEntry[];
	label: string;
	vehicles: VehicleOption[];
	onAdd: () => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, field: keyof TransitEntry, value: string) => void;
}

export const TransitSection: React.FC<TransitSectionProps> = ({
	type,
	transits,
	label,
	vehicles,
	onAdd,
	onRemove,
	onUpdate,
}) => {
	return (
		<div className='mb-8'>
			{/* Header Row */}
			<div className='flex items-center justify-between mb-4'>
				<Badge
					variant='type'
					type={type === 'dispatch' ? 'dispatch' : 'pickup'}
					icon={type === 'dispatch' ? '🚛' : '🚚'}
				>
					{label}
				</Badge>
				<Button
					variant='outline'
					size='sm'
					onClick={e => {
						onAdd();
						e.currentTarget.blur();
					}}
					className='rounded-md border border-green-400 text-green-600 hover:bg-green-50'
				>
					+ Add
				</Button>
			</div>

			{/* Auto-layout Table */}
			<div className='overflow-x-auto'>
				<table className='w-full text-sm text-gray-700 border border-gray-200 rounded-lg table-auto'>
					<thead className='text-gray-600 uppercase text-xs border-b border-gray-200'>
						<tr>
							<th className='px-3 py-2 text-left w-16'>Sl. No</th>
							<th className='px-3 py-2 text-center w-20'>Actions</th>
							<th className='px-3 py-2 text-left'>Time</th>
							<th className='px-3 py-2 text-left'>Vehicle Type</th>
						</tr>
					</thead>
					<tbody>
						{transits.map((transit, index) => (
							<TransitRow
								key={transit.id}
								transit={transit}
								index={index}
								vehicles={vehicles}
								canDelete={transits.length > 1}
								onUpdate={(field, value) => onUpdate(transit.id, field, value)}
								onDelete={() => onRemove(transit.id)}
							/>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
