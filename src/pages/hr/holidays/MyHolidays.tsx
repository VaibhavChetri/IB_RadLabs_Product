import React, { useState } from 'react';
import { PageHeader, Snackbar, FloatingDropdown } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useHolidayData, useMyHolidayChoices, useCreateHolidayChoice, useDeleteHolidayChoice } from '../../../features/hrm';
import { getHolidayTypeColor } from '../../../features/hrm/config/constants';

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

export const MyHolidays: React.FC = () => {
	const [yearFilter, setYearFilter] = useState(String(currentYear));
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const { data: holidayData, isLoading } = useHolidayData({ year: Number(yearFilter), limit: 100 });
	const { data: choicesData } = useMyHolidayChoices(Number(yearFilter));
	const chooseMutation = useCreateHolidayChoice();
	const cancelMutation = useDeleteHolidayChoice();

	const raw = holidayData as any;
	const holidays = raw?.data?.data || raw?.data || raw || [];
	const holidayList = Array.isArray(holidays) ? holidays : [];

	const choicesRaw = choicesData as any;
	const myChoices = choicesRaw?.data || choicesRaw || {};
	const chosenHolidayIds = new Set((myChoices.choices || []).map((c: any) => c.holiday_id));
	const choiceMap = new Map((myChoices.choices || []).map((c: any) => [c.holiday_id, c]));
	const quota = myChoices.quota || 0;
	const remaining = myChoices.remaining ?? quota;

	const handleChoose = async (holidayId: number) => {
		try {
			await chooseMutation.mutateAsync({ holiday_id: holidayId, year: Number(yearFilter) });
			setSnackbar({ open: true, message: 'Holiday chosen successfully', type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: mapError(err?.message || 'Failed to choose holiday'), type: 'error' });
		}
	};

	const handleCancel = async (holidayId: number) => {
		const choice = choiceMap.get(holidayId) as any;
		if (!choice) return;
		try {
			await cancelMutation.mutateAsync(choice.id);
			setSnackbar({ open: true, message: 'Choice cancelled', type: 'success' });
		} catch (err: any) {
			setSnackbar({ open: true, message: mapError(err?.message || 'Failed to cancel choice'), type: 'error' });
		}
	};

	// Group holidays by month
	const grouped = holidayList.reduce((acc: Record<string, any[]>, h: any) => {
		const monthKey = new Date(h.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
		if (!acc[monthKey]) acc[monthKey] = [];
		acc[monthKey].push(h);
		return acc;
	}, {} as Record<string, any[]>);

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-4xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader title='My Holidays' totalItems={holidayList.length} itemType='holidays' icon='📅' />
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
				{quota > 0 && (
					<div className='mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4'>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm font-medium text-amber-800'>Restricted Holiday Quota</span>
							<span className='text-sm text-amber-700'>{myChoices.chosen_count || 0} of {quota} used | {remaining} remaining</span>
						</div>
						<div className='w-full bg-amber-200 rounded-full h-2'>
							<div className='bg-amber-500 h-2 rounded-full transition-all' style={{ width: `${Math.min(((myChoices.chosen_count || 0) / quota) * 100, 100)}%` }} />
						</div>
					</div>
				)}

				{isLoading ? (
					<TableSkeleton rows={6} columns={4} />
				) : holidayList.length === 0 ? (
					<div className='text-center py-12 text-gray-500'>No holidays found for {yearFilter}</div>
				) : (
					<div className='space-y-6'>
						{Object.entries(grouped).map(([month, holidays]) => (
							<div key={month}>
								<h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>{month}</h3>
								<div className='space-y-2'>
									{(holidays as any[]).map((h: any) => {
										const isChosen = chosenHolidayIds.has(h.id);
										const isRestricted = h.type === 'restricted';
										const isPast = new Date(h.date) < new Date(new Date().toDateString());
										const typeColor = getHolidayTypeColor(h.type);

										return (
											<div key={h.id} className='flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors'>
												<div className='flex items-center gap-4'>
													<div className='text-center min-w-[48px]'>
														<div className='text-lg font-bold text-gray-900'>{new Date(h.date).getDate()}</div>
														<div className='text-xs text-gray-500'>{new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
													</div>
													<div>
														<div className='font-medium text-gray-900'>{h.name}</div>
														<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
															{h.type === 'national' ? 'National Holiday' : h.type === 'company' ? 'Company Holiday' : isChosen ? 'Your Choice' : 'Optional'}
														</span>
													</div>
												</div>
												{isRestricted && (
													<div>
														{isChosen ? (
															<div className='flex items-center gap-2'>
																<span className='text-sm text-green-600 font-medium'>Chosen</span>
																{!isPast && (
																	<button
																		onClick={() => handleCancel(h.id)}
																		className='text-xs text-red-500 hover:underline'
																		disabled={cancelMutation.isPending}
																	>
																		Cancel
																	</button>
																)}
															</div>
														) : remaining > 0 && !isPast ? (
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
												)}
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				)}

				<Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} />
			</div>
		</div>
	);
};

export default MyHolidays;
