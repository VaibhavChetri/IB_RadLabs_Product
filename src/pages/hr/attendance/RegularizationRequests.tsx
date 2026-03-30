import React, { useState } from 'react';
import {
	Button,
	FloatingDropdown,
	PageHeader,
	Snackbar,
} from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useAttendanceRegularizations,
	useEmployeeManagerOptions,
	useReviewAttendanceRegularization,
} from '../../../features/hrm';
import { getEmployeeOptionLabel } from '../../../features/hrm/utils/employeeDisplay';

const currentYear = new Date().getFullYear();

const MONTH_OPTIONS = [
	{ value: '', label: 'All Months' },
	...Array.from({ length: 12 }, (_, idx) => ({
		value: String(idx + 1),
		label: new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'short' }),
	})),
];

const YEAR_OPTIONS = [
	{ value: '', label: 'All Years' },
	...Array.from({ length: 3 }, (_, idx) => {
		const year = currentYear - 1 + idx;
		return { value: String(year), label: String(year) };
	}),
];

const STATUS_OPTIONS = [
	{ value: '', label: 'All Requests' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'rejected', label: 'Rejected' },
];

const parseItems = (raw: any) => {
	if (Array.isArray(raw?.data)) return raw.data;
	if (Array.isArray(raw)) return raw;
	return [];
};

const getStatusClasses = (status: string) => {
	switch (status) {
		case 'approved':
			return 'bg-green-50 text-green-700 border-green-200';
		case 'rejected':
			return 'bg-red-50 text-red-700 border-red-200';
		default:
			return 'bg-amber-50 text-amber-700 border-amber-200';
	}
};

export const RegularizationRequests: React.FC = () => {
	const [reviewStatus, setReviewStatus] = useState('pending');
	const [employeeId, setEmployeeId] = useState('');
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data: employeeData } = useEmployeeManagerOptions();
	const { data, isLoading } = useAttendanceRegularizations({
		review_status: reviewStatus ? (reviewStatus as any) : undefined,
		employee_id: employeeId ? Number(employeeId) : undefined,
		month: month ? Number(month) : undefined,
		year: year ? Number(year) : undefined,
		limit: 'all',
	});
	const reviewMutation = useReviewAttendanceRegularization();

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const requests = parseItems(data);

	const handleReview = async (
		id: number,
		nextStatus: 'approved' | 'rejected'
	) => {
		const remarks = window.prompt(
			nextStatus === 'approved'
				? 'Approval remarks (optional)'
				: 'Rejection remarks (optional)'
		);
		try {
			await reviewMutation.mutateAsync({
				id,
				data: { review_status: nextStatus, remarks: remarks || undefined },
			});
			setSnackbar({
				open: true,
				message: `Regularization request ${nextStatus}`,
				type: 'success',
			});
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || `Failed to ${nextStatus} request`,
				type: 'error',
			});
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader
					title='Regularization Requests'
					totalItems={requests.length}
					itemType='requests'
					icon='🧠'
				/>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
						<FloatingDropdown
							label='Review Status'
							options={STATUS_OPTIONS}
							value={reviewStatus}
							onChange={setReviewStatus}
							searchable={false}
						/>
						<FloatingDropdown
							label='Employee'
							options={[
								{ value: '', label: 'All Employees' },
								...employees.map((item: any) => ({
									value: String(item.id),
									label: getEmployeeOptionLabel(item),
								})),
							]}
							value={employeeId}
							onChange={setEmployeeId}
						/>
						<FloatingDropdown
							label='Month'
							options={MONTH_OPTIONS}
							value={month}
							onChange={setMonth}
							searchable={false}
						/>
						<FloatingDropdown
							label='Year'
							options={YEAR_OPTIONS}
							value={year}
							onChange={setYear}
							searchable={false}
						/>
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					{isLoading ? (
						<TableSkeleton rows={5} columns={5} />
					) : (
						<div className='space-y-3'>
							{requests.map((item: any) => (
								<div
									key={item.id}
									className='border border-gray-200 rounded-xl p-4'
								>
									<div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
										<div className='space-y-2'>
											<div className='flex items-center gap-3 flex-wrap'>
												<div className='font-semibold text-gray-900'>
													{item.employee_name || 'Employee'}
												</div>
												<div className='text-xs text-gray-500'>
													{item.employee_code || '--'}
												</div>
												<span
													className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClasses(
														item.review_status
													)}`}
												>
													{item.review_status}
												</span>
											</div>
											<div className='text-sm text-gray-700'>
												{item.attendance_date} • {item.original_status} to{' '}
												{item.requested_status}
											</div>
											<div className='text-sm text-gray-600'>
												Reason: {item.reason}
											</div>
											{item.remarks ? (
												<div className='text-sm text-gray-500'>
													Reviewer note: {item.remarks}
												</div>
											) : null}
										</div>
										{item.review_status === 'pending' ? (
											<div className='flex items-center gap-2 flex-wrap'>
												<Button
													size='sm'
													variant='outline'
													onClick={() => handleReview(item.id, 'rejected')}
													disabled={reviewMutation.isPending}
												>
													Reject
												</Button>
												<Button
													size='sm'
													onClick={() => handleReview(item.id, 'approved')}
													disabled={reviewMutation.isPending}
												>
													Approve
												</Button>
											</div>
										) : null}
									</div>
								</div>
							))}
							{requests.length === 0 ? (
								<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
									No regularization requests found for the selected filters.
								</div>
							) : null}
						</div>
					)}
				</div>
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

export default RegularizationRequests;
