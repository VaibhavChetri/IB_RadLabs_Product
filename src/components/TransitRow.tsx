import React from 'react';
import { TimeInput, BorderlessDropdown } from './ui';
import { Trash2 } from 'lucide-react';
import type { TransitEntry, VehicleOption } from '../hooks/useMasterPlanData';

interface TransitRowProps {
	transit: TransitEntry;
	index: number;
	vehicles: VehicleOption[];
	canDelete: boolean;
	onUpdate: (field: keyof TransitEntry, value: string | number[]) => void;
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

	// Day labels: S M T W T F S (Sunday to Saturday)
	const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const dayNumbers = [0, 1, 2, 3, 4, 5, 6]; // 0=Sunday, 6=Saturday

	const handleDayToggle = (dayNumber: number) => {
		const currentDays = transit.days || [];
		const newDays = currentDays.includes(dayNumber)
			? currentDays.filter(d => d !== dayNumber)
			: [...currentDays, dayNumber].sort();
		onUpdate('days', newDays);
	};

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

			<td className='px-3 py-3'>
				<div className='flex items-center gap-1'>
					{/* Individual day checkboxes */}
					{dayNumbers.map((dayNum, idx) => {
						const isSelected = transit.days?.includes(dayNum) || false;
						return (
							<button
								key={dayNum}
								type='button'
								onClick={() => handleDayToggle(dayNum)}
								className={`w-8 h-8 text-xs font-medium rounded transition-colors flex items-center justify-center ${
									isSelected
										? 'bg-green-600 text-white hover:bg-green-700'
										: 'bg-white text-gray-700 border border-gray-300 hover:border-transparent hover:bg-gray-50'
								}`}
								title={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNum]}
							>
								{dayLabels[idx]}
							</button>
						);
					})}
				</div>
			</td>
		</tr>
	);
};
