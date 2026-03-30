import React, { useState } from 'react';
import { PageHeader, Snackbar, FloatingDropdown } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useHolidayData, useMyHolidayChoices, useCreateHolidayChoice, useDeleteHolidayChoice } from '../../../features/hrm';

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = [
	{ value: String(currentYear - 1), label: String(currentYear - 1) },
	{ value: String(currentYear), label: String(currentYear) },
	{ value: String(currentYear + 1), label: String(currentYear + 1) },
];

const ERROR_MAP: Record<string, string> = {
	'Only restricted holidays can be chosen by employees': 'This holiday cannot be chosen — it applies to everyone automatically.',
	'Cannot choose a holiday that has already passed': 'This date has already passed. You can only choose upcoming holidays.',
	'You have already chosen this holiday': "You've already chosen this holiday.",
	'Cannot cancel a holiday choice after the date has passed': 'This holiday date has passed. You can no longer cancel this choice.',
};

const mapError = (msg: string): string => {
	for (const [key, val] of Object.entries(ERROR_MAP)) {
		if (msg.includes(key)) return val;
	}
	if (msg.includes('already chosen') && msg.includes('restricted holiday')) {
		return "You've reached your holiday quota. Cancel an existing choice to select a different one.";
	}
	return msg;
};

export const MyChoices: React.FC = () => {
	const [yearFilter, setYearFilter] = useState(String(currentYear));
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const { data: holidayData, isLoading: holidaysLoading } = useHolidayData({ year: Number(yearFilter), type: 'restricted', limit: 100 });
	const { data: choicesData, isLoading: choicesLoading } = useMyHolidayChoices(Number(yearFilter));
	const chooseMutation = useCreateHolidayChoice();
	const cancelMutation = useDeleteHolidayChoice();

	const raw = holidayData as any;
	const holidays = raw?.data?.data || raw?.data || raw || [];
	const restrictedHolidays = Array.isArray(holidays) ? holidays : [];

	const choicesRaw = choicesData as any;
	const myChoices = choicesRaw?.data || choicesRaw || {};
	const quota = myChoices.quota || 0;
	const chosenCount = myChoices.chosen_count || 0;
	const remaining = myChoices.remaining ?? (quota - chosenCount);
	const choices = myChoices.choices || [];
	const chosenHolidayIds = new Set(choices.map((c: any) => c.holiday_id));
	const choiceMap = new Map(choices.map((c: any) => [c.holiday_id, c]));

	const available = restrictedHolidays.filter((h: any) => !chosenHolidayIds.has(h.id));
	const loading = holidaysLoading || choicesLoading;

	const handleChoose = async (holidayId: number) => {
		try {
			await chooseMutation.mutateAsync({ holiday_id: holidayId, year: Number(yearFilter) });
			setSnackbar({ open: true, message: 'Holiday chosen', type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: mapError(err?.message || 'Failed'), type: 'error' });
		}
	};

	const handleCancel = async (holidayId: number) => {
		const choice = choiceMap.get(holidayId) as any;
		if (!choice) return;
		try {
			await cancelMutation.mutateAsync(choice.id);
			setSnackbar({ open: true, message: 'Choice cancelled', type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: mapError(err?.message || 'Failed'), type: 'error' });
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-4xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader title='My Restricted Holiday Choices' totalItems={chosenCount} itemType='chosen' icon='🎯' />
				</div>

				<div className='mb-6 flex w-full'>
					<div className='bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg p-4 flex w-full gap-3'>
						<FloatingDropdown
							label='Year'
							options={YEAR_OPTIONS}
							value={yearFilter}
							onChange={(value: string) => setYearFilter(value)}
							className='w-32'
							searchable={false}
						/>
					</div>
				</div>

				{/* Quota bar */}
				<div className='mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4'>
					<div className='flex items-center justify-between mb-2'>
						<span className='text-sm font-medium text-amber-800'>Restricted Holiday Quota</span>
						<span className='text-sm text-amber-700'>{chosenCount} of {quota} used | {remaining} remaining</span>
					</div>
					<div className='w-full bg-amber-200 rounded-full h-2.5'>
						<div className='bg-amber-500 h-2.5 rounded-full transition-all' style={{ width: `${quota > 0 ? Math.min((chosenCount / quota) * 100, 100) : 0}%` }} />
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={4} columns={3} />
				) : (
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{/* Chosen holidays */}
						<div>
							<h3 className='text-base font-semibold text-gray-900 mb-3'>Your Choices ({choices.length})</h3>
							{choices.length === 0 ? (
								<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No holidays chosen yet</div>
							) : (
								<div className='space-y-2'>
									{choices.map((c: any) => {
										const isPast = new Date(c.holiday_date) < new Date(new Date().toDateString());
										return (
											<div key={c.id} className='flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50'>
												<div>
													<div className='font-medium text-gray-900'>{c.holiday_name}</div>
													<div className='text-sm text-gray-500'>
														{new Date(c.holiday_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })}
													</div>
												</div>
												{!isPast && (
													<button
														onClick={() => handleCancel(c.holiday_id)}
														className='text-sm text-red-500 hover:text-red-700 hover:underline'
														disabled={cancelMutation.isPending}
													>
														Cancel
													</button>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* Available holidays */}
						<div>
							<h3 className='text-base font-semibold text-gray-900 mb-3'>Available ({available.length})</h3>
							{available.length === 0 ? (
								<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No more restricted holidays available</div>
							) : (
								<div className='space-y-2'>
									{available.map((h: any) => {
										const isPast = new Date(h.date) < new Date(new Date().toDateString());
										return (
											<div key={h.id} className='flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white'>
												<div>
													<div className='font-medium text-gray-900'>{h.name}</div>
													<div className='text-sm text-gray-500'>
														{new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })}
													</div>
												</div>
												{remaining > 0 && !isPast ? (
													<button
														onClick={() => handleChoose(h.id)}
														className='px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors'
														disabled={chooseMutation.isPending}
													>
														Choose
													</button>
												) : (
													<span className='text-xs text-gray-400'>{isPast ? 'Passed' : 'Quota full'}</span>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				)}

				<Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} />
			</div>
		</div>
	);
};

export default MyChoices;
