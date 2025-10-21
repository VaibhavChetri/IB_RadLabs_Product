import React from 'react';
import { TimeInput, BorderlessDropdown } from './ui';
import { Trash2 } from 'lucide-react';
import type { TransitEntry, VehicleOption } from '../hooks/useMasterPlanData';

interface TransitRowProps {
	transit: TransitEntry;
	index: number;
	vehicles: VehicleOption[];
	canDelete: boolean;
	onUpdate: (field: keyof TransitEntry, value: string) => void;
	onDelete: () => void;
}

export const TransitRow: React.FC<TransitRowProps> = ({
	transit,
	index,
	vehicles,
	canDelete,
	onUpdate,
	onDelete,
}) => {
	const vehicleOptions = vehicles
		.filter(v => v.id && v.driver_name && v.driver_name !== 'Select Vehicle')
		.map(v => ({
			label: `${v.driver_name} (${v.name})`, // Show driver name with vehicle name
			value: String(v.id),
		}));

	return (
		<tr className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
			<td className='px-3 py-3 text-sm text-gray-600 text-left w-16'>{index + 1}</td>

			<td className='px-3 py-3 text-center w-20'>
				<button
					type='button'
					onClick={onDelete}
					disabled={!canDelete}
					className={`p-1.5 rounded transition-colors ${
						canDelete
							? 'text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer'
							: 'text-gray-300 cursor-not-allowed'
					}`}
					title={canDelete ? 'Delete' : 'Cannot delete - minimum one entry required'}
				>
					<Trash2 className='h-4 w-4' />
				</button>
			</td>

			<td className='px-3 py-3 text-right min-w-[100px]'>
				<div className='flex items-center justify-start gap-1'>
					<span className='text-sm text-gray-900 whitespace-nowrap'>
						{transit.date
							? new Date(transit.date).toLocaleDateString('en-US', {
									month: '2-digit',
									day: '2-digit',
									year: '2-digit',
								})
							: new Date().toLocaleDateString('en-US', {
									month: '2-digit',
									day: '2-digit',
									year: '2-digit',
								})}
					</span>
					<div className='relative'>
						<input
							type='date'
							value={transit.date}
							onChange={e => {
								console.log('Date changed:', e.target.value);
								onUpdate('date', e.target.value);
							}}
							className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
						/>
						<svg
							className='w-4 h-4 text-gray-400 cursor-pointer flex-shrink-0'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
							/>
						</svg>
					</div>
				</div>
			</td>

			<td className='px-3 py-3 text-right'>
				<div className='flex justify-start'>
					<TimeInput value={transit.time} onChange={(time: string) => onUpdate('time', time)} />
				</div>
			</td>

			<td className='px-3 py-3 text-right'>
				<div className='flex justify-start'>
					<BorderlessDropdown
						options={vehicleOptions}
						value={transit.vehicleType}
						onChange={(value: string) => onUpdate('vehicleType', value)}
						placeholder='Select Vehicle'
						className='w-full min-w-[200px]'
					/>
				</div>
			</td>
		</tr>
	);
};
