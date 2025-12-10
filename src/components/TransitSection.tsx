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
	onUpdate: (id: string, field: keyof TransitEntry, value: string | number[]) => void;
	onBulkUpdateDays?: (days: number[]) => void;
	showAddButton?: boolean;
}

export const TransitSection: React.FC<TransitSectionProps> = ({
	type,
	transits,
	label,
	vehicles,
	onAdd,
	onRemove,
	onUpdate,
	onBulkUpdateDays,
	showAddButton = true,
}) => {
	// Check if all rows have all days selected
	const allRowsHaveAllDays = transits.length > 0 && transits.every(t => t.days?.length === 7);
	const allDays = [0, 1, 2, 3, 4, 5, 6];

	const handleBulkToggle = () => {
		if (onBulkUpdateDays) {
			onBulkUpdateDays(allRowsHaveAllDays ? [] : allDays);
		}
	};

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
				{showAddButton && (
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
				)}
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
							<th className='px-3 py-2 text-left'>
								<div className='flex items-center gap-2'>
									<span>Days</span>
									{onBulkUpdateDays && (
										<div className='flex items-center gap-1'>
											<span className='text-xs font-normal text-gray-500'>(All)</span>
											<button
												type='button'
												onClick={handleBulkToggle}
												className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
													allRowsHaveAllDays ? 'bg-green-600' : 'bg-gray-300'
												}`}
												title={allRowsHaveAllDays ? 'Disable all days' : 'Enable all days'}
											>
												<span
													className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
														allRowsHaveAllDays ? 'translate-x-5' : 'translate-x-1'
													}`}
												/>
											</button>
										</div>
									)}
								</div>
							</th>
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
