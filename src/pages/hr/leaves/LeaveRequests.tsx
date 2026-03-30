import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	Button,
	FloatingDropdown,
	PageHeader,
	Snackbar,
} from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useCancelLeaveApplication,
	useEmployeeManagerOptions,
	useLeaveApplicationData,
	useLeaveTypeData,
	useReviewLeaveApplication,
	useRevertLopLeaveApplication,
} from '../../../features/hrm';
import { getEmployeeDisplayName, getEmployeeOptionLabel } from '../../../features/hrm/utils/employeeDisplay';
import type { RootState } from '../../../store';

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
	{ value: '', label: 'All Statuses' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'rejected', label: 'Rejected' },
	{ value: 'cancelled', label: 'Cancelled' },
];

const parseItems = (raw: any) => {
	if (Array.isArray(raw?.data)) return raw.data;
	if (Array.isArray(raw)) return raw;
	return [];
};

const formatDate = (value?: string) =>
	value
		? new Date(value).toLocaleDateString('en-IN', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
		  })
		: '--';

const getStatusClasses = (status: string) => {
	switch (status) {
		case 'approved':
			return 'bg-green-50 text-green-700 border-green-200';
		case 'rejected':
			return 'bg-red-50 text-red-700 border-red-200';
		case 'cancelled':
			return 'bg-gray-100 text-gray-600 border-gray-200';
		default:
			return 'bg-amber-50 text-amber-700 border-amber-200';
	}
};

export const LeaveRequests: React.FC = () => {
	const user = useSelector((state: RootState) => state.auth.user);
	const isHrAdmin = /hr|city head/i.test(user?.role || '');

	const [status, setStatus] = useState('pending');
	const [employeeId, setEmployeeId] = useState('');
	const [leaveTypeId, setLeaveTypeId] = useState('');
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));
	const [revertTarget, setRevertTarget] = useState<any | null>(null);
	const [revertLeaveTypeId, setRevertLeaveTypeId] = useState('');
	const [revertRemarks, setRevertRemarks] = useState('');
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data: employeeData } = useEmployeeManagerOptions();
	const { data: leaveTypeData } = useLeaveTypeData({ limit: 'all' });
	const { data: applicationData, isLoading } = useLeaveApplicationData({
		status: status ? (status as any) : undefined,
		employee_id: employeeId ? Number(employeeId) : undefined,
		leave_type_id: leaveTypeId ? Number(leaveTypeId) : undefined,
		month: month ? Number(month) : undefined,
		year: year ? Number(year) : undefined,
		limit: 'all',
	});

	const reviewMutation = useReviewLeaveApplication();
	const cancelMutation = useCancelLeaveApplication();
	const revertMutation = useRevertLopLeaveApplication();

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const currentEmployee = employees.find((item: any) => {
		const userId = Number(user?.id);
		if (Number.isFinite(userId) && Number(item.admin_id) === userId) return true;
		const userEmail = String(user?.email || '').trim().toLowerCase();
		if (userEmail && String(item.email || '').trim().toLowerCase() === userEmail) return true;
		return false;
	});
	const leaveTypes = parseItems(leaveTypeData).filter(
		(item: any) => item.code !== 'LOP'
	);
	const applications = parseItems(applicationData);

	const summaryCounts = useMemo(
		() =>
			applications.reduce(
				(acc: Record<string, number>, item: any) => {
					acc[item.status] = (acc[item.status] || 0) + 1;
					return acc;
				},
				{ pending: 0, approved: 0, rejected: 0, cancelled: 0 }
			),
		[applications]
	);

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
				data: { status: nextStatus, remarks: remarks || undefined },
			});
			setSnackbar({
				open: true,
				message: `Leave request ${nextStatus}`,
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

	const handleCancel = async (id: number) => {
		const reason = window.prompt('Cancellation reason');
		if (!reason) return;
		try {
			await cancelMutation.mutateAsync({
				id,
				data: { cancellation_reason: reason },
			});
			setSnackbar({
				open: true,
				message: 'Leave request cancelled',
				type: 'success',
			});
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to cancel leave request',
				type: 'error',
			});
		}
	};

	const handleRevertLop = async () => {
		if (!revertTarget || !revertLeaveTypeId) return;
		try {
			await revertMutation.mutateAsync({
				id: revertTarget.id,
				data: {
					new_leave_type_id: Number(revertLeaveTypeId),
					remarks: revertRemarks.trim() || undefined,
				},
			});
			setSnackbar({
				open: true,
				message: 'LOP request reverted successfully',
				type: 'success',
			});
			setRevertTarget(null);
			setRevertLeaveTypeId('');
			setRevertRemarks('');
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to revert LOP request',
				type: 'error',
			});
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader
					title='Leave Requests'
					totalItems={applications.length}
					itemType='requests'
					icon='📋'
				/>

				<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
					{[
						['Pending', summaryCounts.pending || 0],
						['Approved', summaryCounts.approved || 0],
						['Rejected', summaryCounts.rejected || 0],
						['Cancelled', summaryCounts.cancelled || 0],
					].map(([label, value]) => (
						<div
							key={String(label)}
							className='border border-gray-200 rounded-xl p-4 bg-white'
						>
							<div className='text-xs text-gray-500'>{label}</div>
							<div className='text-2xl font-bold text-gray-900 mt-1'>
								{value as number}
							</div>
						</div>
					))}
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4'>
						<FloatingDropdown
							label='Status'
							options={STATUS_OPTIONS}
							value={status}
							onChange={setStatus}
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
							label='Leave Type'
							options={[
								{ value: '', label: 'All Leave Types' },
								...leaveTypes.map((item: any) => ({
									value: String(item.id),
									label: `${item.name} (${item.code})`,
								})),
							]}
							value={leaveTypeId}
							onChange={setLeaveTypeId}
							searchable={false}
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
							{applications.map((item: any) => (
								(() => {
									const isOwnRequest =
										!!currentEmployee &&
										Number(item.employee_id) === Number(currentEmployee.id);
									return (
								<div
									key={item.id}
									className='border border-gray-200 rounded-xl p-4'
								>
									<div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
										<div className='space-y-2'>
											<div className='flex items-center gap-3 flex-wrap'>
												<div className='font-semibold text-gray-900'>
													{item.employee_name || getEmployeeDisplayName(currentEmployee) || 'Employee'}
												</div>
												<div className='text-xs text-gray-500'>
													{item.employee_code || '--'}
												</div>
												<span
													className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClasses(
														item.status
													)}`}
												>
													{item.status}
												</span>
												{item.auto_lop_converted ? (
													<span className='px-2.5 py-1 rounded-full text-xs font-medium border border-rose-200 bg-rose-50 text-rose-700'>
														Auto LOP
													</span>
												) : null}
											</div>
											<div className='text-sm text-gray-700'>
												{item.leave_type_name} ({item.leave_type_code}) •{' '}
												{formatDate(item.from_date)} to {formatDate(item.to_date)} •{' '}
												{item.total_days} day(s)
											</div>
											<div className='text-sm text-gray-600'>
												Reason: {item.reason}
											</div>
											{item.reviewer_remarks ? (
												<div className='text-sm text-gray-500'>
													Reviewer note: {item.reviewer_remarks}
												</div>
											) : null}
										</div>
										<div className='flex items-center gap-2 flex-wrap lg:justify-end'>
											{item.status === 'pending' && !isOwnRequest ? (
												<>
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
												</>
											) : null}
											{((isHrAdmin && item.status !== 'cancelled') ||
												(isOwnRequest && item.status === 'pending')) ? (
												<Button
													size='sm'
													variant='secondary'
													onClick={() => handleCancel(item.id)}
													disabled={cancelMutation.isPending}
												>
													Cancel
												</Button>
											) : null}
											{isHrAdmin &&
											!isOwnRequest &&
											item.status === 'pending' &&
											item.auto_lop_converted ? (
												<Button
													size='sm'
													variant='ghost'
													onClick={() => {
														setRevertTarget(item);
														setRevertLeaveTypeId('');
														setRevertRemarks('');
													}}
												>
													Revert LOP
												</Button>
											) : null}
										</div>
									</div>
								</div>
									);
								})()
							))}
							{applications.length === 0 ? (
								<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
									No leave requests found for the selected filters.
								</div>
							) : null}
						</div>
					)}
				</div>
			</div>

			{revertTarget ? (
				<div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
					<div className='bg-white rounded-2xl w-full max-w-lg p-6 space-y-4'>
						<div>
							<h2 className='text-xl font-semibold text-gray-900'>
								Revert Auto LOP
							</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Choose the leave type that should replace this auto-converted LOP
								request.
							</p>
						</div>
						<FloatingDropdown
							label='New Leave Type'
							options={leaveTypes.map((item: any) => ({
								value: String(item.id),
								label: `${item.name} (${item.code})`,
							}))}
							value={revertLeaveTypeId}
							onChange={setRevertLeaveTypeId}
							searchable={false}
						/>
						<div>
							<label className='block text-xs font-medium text-gray-600 mb-1'>
								Remarks
							</label>
							<textarea
								className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm min-h-24'
								value={revertRemarks}
								onChange={e => setRevertRemarks(e.target.value)}
							/>
						</div>
						<div className='flex justify-end gap-3'>
							<Button
								variant='secondary'
								onClick={() => setRevertTarget(null)}
							>
								Close
							</Button>
							<Button
								onClick={handleRevertLop}
								disabled={!revertLeaveTypeId || revertMutation.isPending}
							>
								{revertMutation.isPending ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</div>
				</div>
			) : null}

			<Snackbar
				message={snackbar.message}
				type={snackbar.type}
				open={snackbar.open}
				onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
			/>
		</div>
	);
};

export default LeaveRequests;
