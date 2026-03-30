import React, { useState } from 'react';
import { Snackbar } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useHolidayData,
	useMyHolidayChoices,
	useCreateHolidayChoice,
	useDeleteHolidayChoice,
} from '../../../features/hrm';

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1];

const ERROR_MAP: Record<string, string> = {
	'Only restricted holidays can be chosen by employees':
		'This holiday cannot be chosen — it applies to everyone automatically.',
	'Cannot choose a holiday that has already passed':
		'This date has already passed. You can only choose upcoming holidays.',
	'You have already chosen this holiday': "You've already chosen this holiday.",
	'Cannot cancel a holiday choice after the date has passed':
		'This holiday date has passed. You can no longer cancel this choice.',
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

const TYPE_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
	national: {
		label: 'National',
		dot: 'bg-blue-500',
		badge: 'text-blue-700 bg-blue-50 border border-blue-200',
	},
	company: {
		label: 'Company',
		dot: 'bg-purple-500',
		badge: 'text-purple-700 bg-purple-50 border border-purple-200',
	},
	restricted: {
		label: 'Optional',
		dot: 'bg-amber-500',
		badge: 'text-amber-700 bg-amber-50 border border-amber-200',
	},
};

const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MyHolidays: React.FC = () => {
	const [yearFilter, setYearFilter] = useState(currentYear);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data: holidayData, isLoading } = useHolidayData({ year: yearFilter, limit: 100 });
	const { data: choicesData } = useMyHolidayChoices(yearFilter);
	const chooseMutation = useCreateHolidayChoice();
	const cancelMutation = useDeleteHolidayChoice();

	const raw = holidayData as any;
	const holidays = raw?.data?.data || raw?.data || raw || [];
	const holidayList: any[] = Array.isArray(holidays) ? holidays : [];

	const choicesRaw = choicesData as any;
	const myChoices = choicesRaw?.data || choicesRaw || {};
	const activeChoices = (myChoices.choices || []).filter((c: any) => c.status === 'chosen');
	const chosenIds = new Set<number>(activeChoices.map((c: any) => c.holiday_id));
	const choiceMap = new Map<number, any>(activeChoices.map((c: any) => [c.holiday_id, c]));
	const quota = myChoices.quota || 0;
	const chosen = myChoices.chosen_count ?? activeChoices.length;
	const remaining = myChoices.remaining ?? Math.max(quota - chosen, 0);

	const handleChoose = async (holidayId: number) => {
		try {
			await chooseMutation.mutateAsync({ holiday_id: holidayId, year: yearFilter });
			setSnackbar({ open: true, message: 'Holiday chosen successfully', type: 'success' });
		} catch (err: any) {
			setSnackbar({
				open: true,
				message: mapError(err?.message || 'Failed to choose holiday'),
				type: 'error',
			});
		}
	};

	const handleCancel = async (holidayId: number) => {
		const choice = choiceMap.get(holidayId) as any;
		if (!choice) return;
		try {
			await cancelMutation.mutateAsync(choice.id);
			setSnackbar({ open: true, message: 'Choice cancelled', type: 'success' });
		} catch (err: any) {
			setSnackbar({
				open: true,
				message: mapError(err?.message || 'Failed to cancel choice'),
				type: 'error',
			});
		}
	};

	// Group by month index (0-11)
	const grouped = holidayList.reduce(
		(acc: Record<number, any[]>, h: any) => {
			const m = new Date(h.date).getMonth();
			if (!acc[m]) acc[m] = [];
			acc[m].push(h);
			return acc;
		},
		{} as Record<number, any[]>
	);

	const totalHolidays = holidayList.length;
	const nationalCount = holidayList.filter(h => h.type === 'national').length;
	const companyCount = holidayList.filter(h => h.type === 'company').length;
	const optionalCount = holidayList.filter(h => h.type === 'restricted').length;

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Page Header */}
			<div className='bg-white border-b border-gray-200 px-6 py-5'>
				<div className='max-w-5xl mx-auto flex items-center justify-between'>
					<div>
						<h1 className='text-xl font-semibold text-gray-900'>Holiday Calendar</h1>
						<p className='text-sm text-gray-500 mt-0.5'>
							{yearFilter} — {totalHolidays} holidays
						</p>
					</div>

					{/* Year Tabs */}
					<div className='flex items-center bg-gray-100 rounded-lg p-1 gap-1'>
						{YEAR_OPTIONS.map(y => (
							<button
								key={y}
								onClick={() => setYearFilter(y)}
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
									yearFilter === y
										? 'bg-white text-gray-900 shadow-sm'
										: 'text-gray-500 hover:text-gray-700'
								}`}
							>
								{y}
							</button>
						))}
					</div>
				</div>
			</div>

			<div className='max-w-5xl mx-auto px-6 py-6 space-y-5'>
				{/* Stats Row */}
				<div className='grid grid-cols-4 gap-4'>
					{[
						{ label: 'Total Holidays', value: totalHolidays, color: 'text-gray-900' },
						{ label: 'National', value: nationalCount, color: 'text-blue-600' },
						{ label: 'Company', value: companyCount, color: 'text-purple-600' },
						{ label: 'Optional', value: optionalCount, color: 'text-amber-600' },
					].map(s => (
						<div key={s.label} className='bg-white rounded-xl border border-gray-200 px-5 py-4'>
							<p className='text-xs text-gray-500 mb-1'>{s.label}</p>
							<p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
						</div>
					))}
				</div>

				{/* Restricted Holiday Quota */}
				{quota > 0 && (
					<div className='bg-white rounded-xl border border-gray-200 px-5 py-4'>
						<div className='flex items-center justify-between mb-3'>
							<div className='flex items-center gap-2'>
								<div className='w-2 h-2 rounded-full bg-amber-500' />
								<span className='text-sm font-medium text-gray-700'>Optional Holiday Quota</span>
							</div>
							<div className='flex items-center gap-3 text-sm'>
								<span className='text-gray-500'>
									{chosen} of {quota} used
								</span>
								<span
									className={`font-semibold px-2 py-0.5 rounded-full text-xs ${remaining > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
								>
									{remaining} remaining
								</span>
							</div>
						</div>
						<div className='w-full bg-gray-100 rounded-full h-1.5'>
							<div
								className='bg-amber-500 h-1.5 rounded-full transition-all duration-300'
								style={{ width: `${Math.min((chosen / quota) * 100, 100)}%` }}
							/>
						</div>
					</div>
				)}

				{/* Holiday List */}
				{isLoading ? (
					<div className='bg-white rounded-xl border border-gray-200 p-6'>
						<TableSkeleton rows={6} columns={3} />
					</div>
				) : holidayList.length === 0 ? (
					<div className='bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-center'>
						<div className='text-4xl mb-3'>📅</div>
						<p className='text-gray-600 font-medium'>No holidays found</p>
						<p className='text-sm text-gray-400 mt-1'>
							No holidays have been added for {yearFilter}
						</p>
					</div>
				) : (
					<div className='bg-white rounded-xl border border-gray-200 divide-y divide-gray-100'>
						{Object.keys(grouped)
							.map(Number)
							.sort((a, b) => a - b)
							.map(monthIdx => (
								<div key={monthIdx}>
									{/* Month header */}
									<div className='px-5 py-3 bg-gray-50 border-b border-gray-100'>
										<span className='text-xs font-semibold text-gray-500 uppercase tracking-widest'>
											{MONTH_NAMES[monthIdx]} {yearFilter}
										</span>
									</div>

									{/* Holidays in month */}
									{grouped[monthIdx].map((h: any) => {
										const date = new Date(h.date);
										const isChosen = chosenIds.has(h.id);
										const isOptional = h.type === 'restricted';
										const isPast = date < new Date(new Date().toDateString());
										const cfg = TYPE_CONFIG[h.type] || TYPE_CONFIG.national;
										const chosenLabel = isChosen ? 'Your Choice of Holiday' : cfg.label;

										return (
											<div
												key={h.id}
												className={`flex items-center justify-between px-5 py-4 transition-colors ${isChosen ? 'bg-emerald-50 border-l-4 border-l-emerald-300 hover:bg-emerald-50' : 'hover:bg-gray-50'}`}
											>
												{/* Date block */}
												<div className='flex items-center gap-5'>
													<div className='text-center w-11 shrink-0'>
														<div className='text-lg font-bold text-gray-900 leading-none'>
															{date.getDate()}
														</div>
														<div className='text-xs text-gray-400 mt-0.5'>
															{DAY_NAMES[date.getDay()]}
														</div>
													</div>

													{/* Divider dot */}
													<div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

													{/* Name + badge */}
													<div>
														<p
															className={`text-sm font-medium ${isPast ? 'text-gray-400' : 'text-gray-900'}`}
														>
															{h.name}
														</p>
														<span
															className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${isChosen ? 'text-emerald-700 bg-emerald-100 border border-emerald-200' : cfg.badge}`}
														>
															{isChosen ? 'Your Choice of Holiday ✓' : chosenLabel}
														</span>
													</div>
												</div>

												{/* Action */}
												<div className='flex items-center gap-3 shrink-0'>
													{isPast && !isChosen && (
														<span className='text-xs text-gray-400'>Passed</span>
													)}
													{isOptional && isChosen && (
														<div className='flex items-center gap-3'>
															{!isPast && (
																<button
																	onClick={() => handleCancel(h.id)}
																	disabled={cancelMutation.isPending}
																	className='px-2.5 py-1 text-xs font-medium text-red-600 bg-white/80 border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50'
																>
																	Cancel
																</button>
															)}
														</div>
													)}
													{isOptional && !isChosen && !isPast && remaining > 0 && (
														<button
															onClick={() => handleChoose(h.id)}
															disabled={chooseMutation.isPending}
															className='px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50'
														>
															Choose
														</button>
													)}
													{isOptional && !isChosen && !isPast && remaining === 0 && (
														<span className='text-xs text-gray-400 italic'>Quota full</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
							))}
					</div>
				)}
			</div>

			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};

export default MyHolidays;
