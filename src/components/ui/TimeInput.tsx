import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface TimeInputProps {
	value?: string;
	onChange: (time: string) => void;
	className?: string;
	disabled?: boolean;
}

export const TimeInput: React.FC<TimeInputProps> = ({
	value = '',
	onChange,
	className,
	disabled = false,
}) => {
	const [hour, setHour] = useState('');
	const [minute, setMinute] = useState('');
	const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

	// Parse initial value
	useEffect(() => {
		if (value) {
			const [time, periodPart] = value.split(' ');
			if (time) {
				const [h, m] = time.split(':');
				setHour(h || '');
				setMinute(m || '');
				setPeriod(periodPart === 'PM' ? 'PM' : 'AM');
			}
		}
	}, [value]);

	// Update parent when internal state changes
	useEffect(() => {
		if (hour && minute) {
			onChange(`${hour}:${minute} ${period}`);
		}
	}, [hour, minute, period, onChange]);

	const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value.replace(/\D/g, '').slice(0, 2);
		setHour(val);

		// Auto-focus minute input when hour is complete
		if (val.length === 2) {
			const minuteInput = e.target.parentElement?.querySelector(
				'input[data-minute]'
			) as HTMLInputElement;
			minuteInput?.focus();
		}
	};

	const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value.replace(/\D/g, '').slice(0, 2);
		setMinute(val);
	};

	const togglePeriod = () => {
		setPeriod(prev => (prev === 'AM' ? 'PM' : 'AM'));
	};

	return (
		<div className={cn('flex items-center', className)}>
			<div className='flex items-center gap-0'>
				<input
					type='text'
					value={hour}
					onChange={handleHourChange}
					placeholder='00'
					disabled={disabled}
					className='w-4 md:w-6 text-center border-none bg-transparent py-1 text-gray-900 focus:outline-none focus:ring-0'
					style={{ fontSize: '12px', lineHeight: '16px' }}
					maxLength={2}
				/>
				<span className='text-gray-500 font-bold' style={{ fontSize: '12px', lineHeight: '16px' }}>
					:
				</span>
				<input
					type='text'
					data-minute
					value={minute}
					onChange={handleMinuteChange}
					placeholder='00'
					disabled={disabled}
					className='w-6 text-center border-none bg-transparent py-1 text-gray-900 focus:outline-none focus:ring-0'
					style={{ fontSize: '12px', lineHeight: '16px' }}
					maxLength={2}
				/>
			</div>

			<div className='flex gap-1'>
				<button
					type='button'
					onClick={() => setPeriod('AM')}
					disabled={disabled}
					className={cn(
						'px-1 py-0.5 text-xs rounded transition-colors',
						period === 'AM' ? 'bg-green-100 text-green-800' : 'text-gray-500 hover:text-gray-700'
					)}
				>
					AM
				</button>
				<button
					type='button'
					onClick={() => setPeriod('PM')}
					disabled={disabled}
					className={cn(
						'px-1 py-0.5 text-xs rounded transition-colors',
						period === 'PM' ? 'bg-green-100 text-green-800' : 'text-gray-500 hover:text-gray-700'
					)}
				>
					PM
				</button>
			</div>
		</div>
	);
};
