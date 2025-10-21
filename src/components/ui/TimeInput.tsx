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
	const [isInitialized, setIsInitialized] = useState(false);

	// Parse initial value ONLY once
	useEffect(() => {
		if (value && !isInitialized) {
			if (value.includes('AM') || value.includes('PM')) {
				const [time, periodPart] = value.split(' ');
				if (time) {
					const [h, m] = time.split(':');
					setHour(h || '');
					setMinute(m || '');
					setPeriod(periodPart === 'PM' ? 'PM' : 'AM');
				}
			} else {
				const [h, m] = value.split(':');
				const hourNum = parseInt(h || '0', 10);
				setMinute(m || '');
				if (hourNum >= 12) {
					setPeriod('PM');
					setHour((((hourNum - 1) % 12) + 1).toString().padStart(2, '0'));
				} else {
					setPeriod('AM');
					setHour(hourNum === 0 ? '12' : String(hourNum).padStart(2, '0'));
				}
			}
			setIsInitialized(true);
		}
	}, []);

	// Emit only when BOTH fields are 2 digits with valid values
	useEffect(() => {
		if (hour && hour.length === 2 && minute && minute.length === 2) {
			const hourNum = parseInt(hour, 10);
			const minuteNum = parseInt(minute, 10);

			// Only emit if values are in valid range
			if (hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59) {
				onChange(`${hour}:${minute} ${period}`);
			}
		}
	}, [hour, minute, period, onChange]);

	const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = e.target.value.replace(/\D/g, '').slice(0, 2);

		if (val === '') {
			setHour('');
			return;
		}

		let num = parseInt(val, 10);

		// Auto-convert 24-hour to 12-hour when field is complete
		if (val.length === 2) {
			if (num === 0 || num === 24) {
				setHour('12');
				setPeriod('AM');
			} else if (num > 12) {
				setHour(String(num - 12).padStart(2, '0'));
				setPeriod('PM');
			} else if (num === 12) {
				setHour('12');
				setPeriod('PM');
			} else {
				setHour(val.padStart(2, '0'));
			}
		} else {
			// Just store the raw value while typing
			setHour(val);
		}
	};

	const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		let val = e.target.value.replace(/\D/g, '').slice(0, 2);

		if (val === '') {
			setMinute('');
			return;
		}

		// Cap at 59 when field is complete
		if (val.length === 2) {
			let num = parseInt(val, 10);
			if (num > 59) num = 59;
			setMinute(String(num).padStart(2, '0'));
		} else {
			// Just store the raw value while typing
			setMinute(val);
		}
	};

	// ✅ Fix 3: Arrow key logic now works for both fields safely
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'hour' | 'minute') => {
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			if (type === 'hour') {
				let current = parseInt(hour || '12', 10);
				if (e.key === 'ArrowUp') current = current >= 12 ? 1 : current + 1;
				else current = current <= 1 ? 12 : current - 1;
				setHour(current.toString().padStart(2, '0'));
			} else {
				let current = parseInt(minute || '00', 10);
				if (e.key === 'ArrowUp') current = current >= 59 ? 0 : current + 1;
				else current = current <= 0 ? 59 : current - 1;
				setMinute(current.toString().padStart(2, '0'));
			}
		}
	};

	return (
		<div
			className={cn(
				'flex items-center gap-1 text-[12px] border border-gray-300 rounded-md px-3 py-2 bg-white hover:border-green-400 focus-within:border-green-400 transition-all',
				className
			)}
		>
			<input
				type='text'
				value={hour}
				onChange={handleHourChange}
				onKeyDown={e => handleKeyDown(e, 'hour')}
				disabled={disabled}
				className='w-8 text-center text-gray-800 font-medium focus:outline-none bg-transparent'
				maxLength={2}
				placeholder='HH'
			/>
			<span className='text-gray-400 select-none'>:</span>
			<input
				type='text'
				data-minute
				value={minute}
				onChange={handleMinuteChange}
				onKeyDown={e => handleKeyDown(e, 'minute')}
				disabled={disabled}
				className='w-8 text-center text-gray-800 font-medium focus:outline-none bg-transparent'
				maxLength={2}
				placeholder='MM'
			/>
			<div className='flex gap-1 ml-2'>
				{['AM', 'PM'].map(p => (
					<button
						key={p}
						type='button'
						onClick={() => setPeriod(p as 'AM' | 'PM')}
						disabled={disabled}
						className={cn(
							'px-1 py-1 text-[9px] rounded-md border transition-all',
							period === p
								? 'bg-green-600 text-white border-green-600'
								: 'border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-300'
						)}
					>
						{p}
					</button>
				))}
			</div>
		</div>
	);
};
