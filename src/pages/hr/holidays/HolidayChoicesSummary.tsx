import React, { useState } from 'react';
import { PageHeader, Snackbar, FloatingDropdown } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { useHolidayChoicesSummary } from '../../../features/hrm';

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = [
	{ value: String(currentYear - 1), label: String(currentYear - 1) },
	{ value: String(currentYear), label: String(currentYear) },
	{ value: String(currentYear + 1), label: String(currentYear + 1) },
];

export const HolidayChoicesSummary: React.FC = () => {
	const [yearFilter, setYearFilter] = useState(String(currentYear));
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const { data: summaryData, isLoading, error } = useHolidayChoicesSummary(Number(yearFilter));

	React.useEffect(() => {
		if (error) {
			setSnackbar({ open: true, message: 'Failed to load summary', type: 'error' });
		}
	}, [error]);

	const raw = summaryData as any;
	const summaryList = raw?.data?.data || raw?.data || raw || [];
	const items = Array.isArray(summaryList) ? summaryList : [];
	const maxChosen = Math.max(...items.map((i: any) => i.total_chosen || 0), 1);

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-4xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader title='Holiday Choices Summary' totalItems={items.length} itemType='holidays' icon='📊' />
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

				{isLoading ? (
					<TableSkeleton rows={5} columns={3} />
				) : items.length === 0 ? (
					<div className='text-center py-12 text-gray-500'>No restricted holiday data for {yearFilter}</div>
				) : (
					<div className='space-y-3'>
						{items.map((item: any) => (
							<div key={item.holiday_id} className='flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors'>
								<div className='min-w-[200px]'>
									<div className='font-medium text-gray-900'>{item.holiday_name}</div>
									<div className='text-sm text-gray-500'>
										{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
									</div>
								</div>
								<div className='flex-1'>
									<div className='w-full bg-gray-100 rounded-full h-4'>
										<div
											className='bg-blue-500 h-4 rounded-full transition-all flex items-center justify-end pr-2'
											style={{ width: `${Math.max((item.total_chosen / maxChosen) * 100, 8)}%` }}
										>
											{item.total_chosen > 2 && (
												<span className='text-xs text-white font-medium'>{item.total_chosen}</span>
											)}
										</div>
									</div>
								</div>
								<div className='min-w-[60px] text-right'>
									<span className='text-lg font-bold text-gray-900'>{item.total_chosen}</span>
									<span className='text-sm text-gray-500 ml-1'>chosen</span>
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

export default HolidayChoicesSummary;
