import React, { useMemo, useState } from 'react';
import { Button, FloatingDropdown, PageHeader, Snackbar } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useCancelLeaveApplication,
	useCreateLeaveApplication,
	useLeaveApplicationData,
	useLeaveTypeData,
	useMyLeaveBalances,
} from '../../../features/hrm';

const currentYear = new Date().getFullYear();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, idx) => ({
	value: String(idx + 1),
	label: new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'short' }),
}));
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1].map(year => ({ value: String(year), label: String(year) }));
const STATUS_OPTIONS = [
	{ value: '', label: 'All' },
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

const formatDays = (value: number) => {
	if (!Number.isFinite(value)) return '0';
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const normalizeKey = (value: unknown) => String(value || '').trim().toLowerCase();

const getStatusClasses = (status: string) => {
	switch (status) {
		case 'approved':
			return 'bg-green-50 text-green-700 border border-green-200';
		case 'rejected':
			return 'bg-red-50 text-red-700 border border-red-200';
		case 'cancelled':
			return 'bg-gray-100 text-gray-600 border border-gray-200';
		default:
			return 'bg-amber-50 text-amber-700 border border-amber-200';
	}
};

export const MyLeaves: React.FC = () => {
	const [month, setMonth] = useState(String(new Date().getMonth() + 1));
	const [year, setYear] = useState(String(currentYear));
	const [status, setStatus] = useState('');
	const [leaveTypeId, setLeaveTypeId] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [isHalfDay, setIsHalfDay] = useState(false);
	const [halfDayType, setHalfDayType] = useState('');
	const [reason, setReason] = useState('');
	const [documentUrl, setDocumentUrl] = useState('');
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'success' });

	const { data: balanceData, isLoading: balancesLoading } = useMyLeaveBalances();
	const { data: leaveTypeData } = useLeaveTypeData({ is_active: true, limit: 'all' });
	const { data: pendingApplicationData } = useLeaveApplicationData({
		status: 'pending',
		limit: 'all',
	});
	const { data: applicationData, isLoading: applicationsLoading } = useLeaveApplicationData({
		status: (status || undefined) as
			| 'pending'
			| 'approved'
			| 'rejected'
			| 'cancelled'
			| undefined,
		month: Number(month),
		year: Number(year),
		limit: 'all',
	});

	const createMutation = useCreateLeaveApplication();
	const cancelMutation = useCancelLeaveApplication();

	const balancePayload = (balanceData as any)?.data || balanceData || {};
	const balances = Array.isArray(balancePayload?.balances) ? balancePayload.balances : [];
	const leaveTypesRaw = (leaveTypeData as any)?.data || leaveTypeData || [];
	const leaveTypes = parseItems(leaveTypesRaw).filter((item: any) => item.code !== 'LOP');
	const pendingApplications = parseItems(pendingApplicationData);
	const applications = parseItems(applicationData);

	const pendingDaysByLeaveType = useMemo(() => {
		return pendingApplications.reduce((acc: Record<string, number>, item: any) => {
			const totalDays = Number(item.total_days ?? 0);
			if (!Number.isFinite(totalDays)) return acc;

			const keys = [
				normalizeKey(item.leave_type_id),
				normalizeKey(item.leave_type_code),
				normalizeKey(item.leave_type_name),
			].filter(Boolean);

			keys.forEach(key => {
				acc[key] = (acc[key] || 0) + totalDays;
			});

			return acc;
		}, {});
	}, [pendingApplications]);

	const selectedLeaveType = leaveTypes.find((item: any) => String(item.id) === leaveTypeId);
	const selectedBalance = balances.find((item: any) => item.leave_type_id === Number(leaveTypeId));
	const selectedClosingBalance = Number(selectedBalance?.closing_balance ?? 0);
	const selectedPendingDays = Number(
		pendingDaysByLeaveType[normalizeKey(selectedBalance?.leave_type_id)] ??
			pendingDaysByLeaveType[normalizeKey(selectedBalance?.leave_type_code)] ??
			pendingDaysByLeaveType[normalizeKey(selectedBalance?.leave_type_name)] ??
			0
	);
	const selectedAvailableToApply = Math.max(selectedClosingBalance - selectedPendingDays, 0);

	const totalDays = useMemo(() => {
		if (!fromDate || !toDate) return 0;
		if (isHalfDay) return 0.5;
		const from = new Date(fromDate);
		const to = new Date(toDate);
		const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		return Number.isFinite(diff) && diff > 0 ? diff : 0;
	}, [fromDate, toDate, isHalfDay]);

	const handleSubmit = async () => {
		if (!leaveTypeId || !fromDate || !toDate || reason.trim().length < 3) return;
		try {
			const available = selectedAvailableToApply;
			const isLop = totalDays > available;
			if (isLop && !window.confirm(`You have ${available} day(s) available. This may be marked as Loss of Pay (LOP). Continue?`)) {
				return;
			}
			await createMutation.mutateAsync({
				leave_type_id: Number(leaveTypeId),
				from_date: fromDate,
				to_date: toDate,
				is_half_day: isHalfDay,
				half_day_type: isHalfDay ? (halfDayType as 'first_half' | 'second_half') : null,
				reason: reason.trim(),
				document_url: documentUrl.trim() || null,
			});
			setSnackbar({ open: true, message: 'Leave request submitted', type: 'success' });
			setLeaveTypeId('');
			setFromDate('');
			setToDate('');
			setIsHalfDay(false);
			setHalfDayType('');
			setReason('');
			setDocumentUrl('');
		} catch (error: any) {
			setSnackbar({ open: true, message: error?.message || 'Failed to submit leave request', type: 'error' });
		}
	};

	const handleCancel = async (id: number) => {
		const reasonText = window.prompt('Cancellation reason');
		if (!reasonText) return;
		try {
			await cancelMutation.mutateAsync({ id, data: { cancellation_reason: reasonText } });
			setSnackbar({ open: true, message: 'Leave request cancelled', type: 'success' });
		} catch (error: any) {
			setSnackbar({ open: true, message: error?.message || 'Failed to cancel leave request', type: 'error' });
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-6xl mx-auto space-y-6'>
				<PageHeader title='My Leaves' totalItems={applications.length} itemType='applications' icon='📝' />

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					<div className='lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5'>
						<h2 className='text-lg font-semibold text-gray-900 mb-4'>Apply Leave</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<FloatingDropdown
								label='Leave Type'
								options={leaveTypes.map((item: any) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))}
								value={leaveTypeId}
								onChange={setLeaveTypeId}
								placeholder='Select leave type'
								searchable={false}
							/>
							<div className='border border-gray-200 rounded-md px-4 py-3 bg-gray-50 text-sm text-gray-600'>
								<div>Leave snapshot</div>
								<div className='mt-2 space-y-1'>
									<div className='flex items-center justify-between gap-3'>
										<span>Available</span>
										<span className='font-semibold text-gray-900'>
											{leaveTypeId ? formatDays(selectedAvailableToApply) : '--'} day(s)
										</span>
									</div>
									<div className='flex items-center justify-between gap-3'>
										<span>Pending</span>
										<span className='font-medium text-amber-700'>
											{leaveTypeId ? formatDays(selectedPendingDays) : '--'} day(s)
										</span>
									</div>
									<div className='flex items-center justify-between gap-3'>
										<span>Total quota</span>
										<span className='font-medium text-gray-700'>
											{leaveTypeId ? formatDays(Number(selectedBalance?.annual_quota ?? 0)) : '--'} day(s)
										</span>
									</div>
								</div>
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>From Date</label>
								<input className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm' type='date' value={fromDate} onChange={e => setFromDate(e.target.value)} />
							</div>
							<div>
								<label className='block text-xs font-medium text-gray-600 mb-1'>To Date</label>
								<input className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm' type='date' value={toDate} onChange={e => setToDate(e.target.value)} />
							</div>
							<div className='md:col-span-2 flex items-center gap-3'>
								<input id='half-day' type='checkbox' checked={isHalfDay} onChange={e => setIsHalfDay(e.target.checked)} />
								<label htmlFor='half-day' className='text-sm text-gray-700'>Half Day</label>
								{isHalfDay && (
									<FloatingDropdown
										label='Half Day Type'
										options={[
											{ value: 'first_half', label: 'First Half' },
											{ value: 'second_half', label: 'Second Half' },
										]}
										value={halfDayType}
										onChange={setHalfDayType}
										className='w-56'
										searchable={false}
									/>
								)}
							</div>
							<div className='md:col-span-2'>
								<label className='block text-xs font-medium text-gray-600 mb-1'>Reason</label>
								<textarea className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm min-h-28' value={reason} onChange={e => setReason(e.target.value)} />
							</div>
							{selectedLeaveType?.requires_document ? (
								<div className='md:col-span-2'>
									<label className='block text-xs font-medium text-gray-600 mb-1'>Document URL</label>
									<input className='w-full border border-gray-300 rounded-md px-3 py-3 text-sm' value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} />
								</div>
							) : null}
						</div>
						<div className='mt-4 flex items-center justify-between'>
							<div className='text-sm text-gray-500'>Calculated days: <span className='font-semibold text-gray-900'>{totalDays || 0}</span></div>
							<Button variant='primary' onClick={handleSubmit} disabled={createMutation.isPending || !leaveTypeId || !fromDate || !toDate || reason.trim().length < 3 || (isHalfDay && !halfDayType)}>
								{createMutation.isPending ? 'Submitting...' : 'Submit Leave'}
							</Button>
						</div>
					</div>

					<div className='bg-white border border-gray-200 rounded-xl p-5'>
						<h2 className='text-lg font-semibold text-gray-900 mb-4'>Leave Balances</h2>
						{balancesLoading ? <TableSkeleton rows={4} columns={1} /> : (
							<div className='space-y-3'>
								{balances.filter((item: any) => item.leave_type_code !== 'LOP').map((item: any) => (
									<div key={item.leave_type_id} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
										{(() => {
											const pendingDays = Number(
												pendingDaysByLeaveType[normalizeKey(item.leave_type_id)] ??
													pendingDaysByLeaveType[normalizeKey(item.leave_type_code)] ??
													pendingDaysByLeaveType[normalizeKey(item.leave_type_name)] ??
													0
											);
											const availableDays = Math.max(Number(item.closing_balance ?? 0) - pendingDays, 0);
											return (
										<div className='flex items-start justify-between gap-4'>
											<div>
												<div className='font-medium text-gray-900'>{item.leave_type_name}</div>
												<div className='text-xs text-gray-500'>{item.leave_type_code}</div>
											</div>
											<div className='text-right space-y-1'>
												<div>
													<div className='text-lg font-bold text-gray-900'>
														{formatDays(availableDays)}
													</div>
													<div className='text-xs text-gray-500'>available</div>
												</div>
												<div className='text-xs text-amber-700'>
													Pending: {formatDays(pendingDays)}
												</div>
												<div className='text-xs text-gray-500'>
													Total quota: {formatDays(Number(item.annual_quota ?? 0))}
												</div>
											</div>
										</div>
											);
										})()}
									</div>
								))}
								{balances.length === 0 ? <div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No leave balance data available for this user yet.</div> : null}
							</div>
						)}
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='flex items-center justify-between gap-4 mb-4 flex-wrap'>
						<h2 className='text-lg font-semibold text-gray-900'>My Leave Applications</h2>
						<div className='flex gap-3 flex-wrap'>
							<FloatingDropdown label='Status' options={STATUS_OPTIONS} value={status} onChange={setStatus} className='w-44' searchable={false} />
							<FloatingDropdown label='Month' options={MONTH_OPTIONS} value={month} onChange={setMonth} className='w-36' searchable={false} />
							<FloatingDropdown label='Year' options={YEAR_OPTIONS} value={year} onChange={setYear} className='w-32' searchable={false} />
						</div>
					</div>
					{applicationsLoading ? <TableSkeleton rows={5} columns={5} /> : (
						<div className='space-y-3'>
							{applications.map((item: any) => (
								<div key={item.id} className='border border-gray-200 rounded-lg p-4'>
									<div className='flex items-start justify-between gap-4'>
										<div>
											<div className='font-medium text-gray-900'>{item.leave_type_name} ({item.leave_type_code})</div>
											<div className='text-sm text-gray-500 mt-1'>
												{item.from_date} to {item.to_date} • {item.total_days} day(s)
											</div>
											<div className='text-sm text-gray-600 mt-2'>{item.reason}</div>
										</div>
										<div className='flex flex-col items-end gap-2'>
											<span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses(item.status)}`}>{item.status}</span>
											{item.status === 'pending' ? (
												<button className='text-sm text-red-600 hover:text-red-700' onClick={() => handleCancel(item.id)}>
													Cancel
												</button>
											) : null}
										</div>
									</div>
								</div>
							))}
							{applications.length === 0 ? <div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>No leave applications found for the selected filters.</div> : null}
						</div>
					)}
				</div>
			</div>
			<Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} />
		</div>
	);
};

export default MyLeaves;
