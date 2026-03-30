import React, { useEffect, useMemo, useState } from 'react';
import { Button, PageHeader, Snackbar } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useEmployeeManagerOptions,
	useMarkAttendance,
	useTeamAttendance,
} from '../../../features/hrm';
import { getEmployeeDisplayName } from '../../../features/hrm/utils/employeeDisplay';

type CellState = 'present' | 'absent' | 'weekend';

const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();

const getDaysInMonth = (month: number, year: number) =>
	new Date(year, month, 0).getDate();

const toIsoDate = (year: number, month: number, day: number) =>
	`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const isWeekend = (year: number, month: number, day: number) => {
	const value = new Date(year, month - 1, day).getDay();
	return value === 0 || value === 6;
};

const getCellClasses = (state: CellState) => {
	if (state === 'weekend') {
		return 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
	}
	if (state === 'present') {
		return 'bg-emerald-50 border-emerald-200 text-emerald-700';
	}
	return 'bg-red-50 border-red-200 text-red-700';
};

export const MarkAttendance: React.FC = () => {
	const [attendanceGrid, setAttendanceGrid] = useState<Record<string, CellState>>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });

	const { data: employeeData, isLoading: employeeLoading } = useEmployeeManagerOptions();
	const { data: existingAttendanceData, isLoading: attendanceLoading } = useTeamAttendance({
		month: currentMonth,
		year: currentYear,
		limit: 'all',
	});
	const markMutation = useMarkAttendance();

	const employees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const existingRows = Array.isArray((existingAttendanceData as any)?.data)
		? (existingAttendanceData as any).data
		: Array.isArray(existingAttendanceData)
		? existingAttendanceData
		: [];

	const days = useMemo(
		() =>
			Array.from(
				{ length: getDaysInMonth(currentMonth, currentYear) },
				(_, index) => index + 1
			),
		[]
	);

	useEffect(() => {
		if (!employees.length) return;

		const nextGrid: Record<string, CellState> = {};

		employees.forEach((employee: any) => {
			days.forEach(day => {
				const dateKey = toIsoDate(currentYear, currentMonth, day);
				const key = `${employee.id}-${dateKey}`;
				nextGrid[key] = isWeekend(currentYear, currentMonth, day)
					? 'weekend'
					: 'present';
			});
		});

		existingRows.forEach((row: any) => {
			(row.records || []).forEach((record: any) => {
				const key = `${row.employee_id}-${record.date}`;
				if (record.status === 'weekend') {
					nextGrid[key] = 'weekend';
				} else if (record.status === 'absent') {
					nextGrid[key] = 'absent';
				} else if (record.status) {
					nextGrid[key] = 'present';
				}
			});
		});

		setAttendanceGrid(nextGrid);
	}, [employees, existingRows, days]);

	const getCellState = (employeeId: number, day: number): CellState => {
		const key = `${employeeId}-${toIsoDate(currentYear, currentMonth, day)}`;
		return attendanceGrid[key] || (isWeekend(currentYear, currentMonth, day) ? 'weekend' : 'present');
	};

	const setCellState = (employeeId: number, day: number, value: CellState) => {
		const key = `${employeeId}-${toIsoDate(currentYear, currentMonth, day)}`;
		setAttendanceGrid(prev => ({ ...prev, [key]: value }));
	};

	const toggleCell = (employeeId: number, day: number) => {
		const current = getCellState(employeeId, day);
		if (current === 'weekend') return;
		setCellState(employeeId, day, current === 'present' ? 'absent' : 'present');
	};

	const toggleColumn = (day: number, checked: boolean) => {
		setAttendanceGrid(prev => {
			const next = { ...prev };
			employees.forEach((employee: any) => {
				const key = `${employee.id}-${toIsoDate(currentYear, currentMonth, day)}`;
				if ((prev[key] || (isWeekend(currentYear, currentMonth, day) ? 'weekend' : 'present')) !== 'weekend') {
					next[key] = checked ? 'present' : 'absent';
				}
			});
			return next;
		});
	};

	const getColumnState = (day: number) => {
		const states = employees
			.map((employee: any) => getCellState(employee.id, day))
			.filter((state: CellState) => state !== 'weekend');

		if (!states.length) return 'weekend';
		return states.every((state: CellState) => state === 'present')
			? 'present'
			: 'absent';
	};

	const totalPresentSelections = useMemo(
		() =>
			employees.reduce((count: number, employee: any) => {
				return (
					count +
					days.filter(day => getCellState(employee.id, day) === 'present').length
				);
			}, 0),
		[attendanceGrid, employees, days]
	);

	const totalAbsentSelections = useMemo(
		() =>
			employees.reduce((count: number, employee: any) => {
				return (
					count +
					days.filter(day => getCellState(employee.id, day) === 'absent').length
				);
			}, 0),
		[attendanceGrid, employees, days]
	);

	const handleSubmit = async () => {
		if (!employees.length) return;

		try {
			for (const day of days) {
				const date = toIsoDate(currentYear, currentMonth, day);
				const presentEmployeeIds = employees
					.filter((employee: any) => getCellState(employee.id, day) === 'present')
					.map((employee: any) => employee.id);
				const absentEmployeeIds = employees
					.filter((employee: any) => getCellState(employee.id, day) === 'absent')
					.map((employee: any) => employee.id);

				if (presentEmployeeIds.length) {
					await markMutation.mutateAsync({
						employee_ids: presentEmployeeIds,
						from_date: date,
						to_date: date,
						status: 'present',
						half_day_session: null,
						remarks: `Attendance sheet marked for ${date}`,
					});
				}

				if (absentEmployeeIds.length) {
					await markMutation.mutateAsync({
						employee_ids: absentEmployeeIds,
						from_date: date,
						to_date: date,
						status: 'absent',
						half_day_session: null,
						remarks: `Attendance sheet marked for ${date}`,
					});
				}
			}

			setSnackbar({
				open: true,
				message: `Attendance saved for ${employees.length} employee(s) for ${today.toLocaleString('en-IN', {
					month: 'long',
				})} ${currentYear}.`,
				type: 'success',
			});
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: error?.message || 'Failed to save attendance sheet',
				type: 'error',
			});
		}
	};

	const loading = employeeLoading || attendanceLoading;

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-[95rem] mx-auto space-y-6'>
				<PageHeader
					title='Mark Attendance'
					totalItems={employees.length}
					itemType='team members'
					icon='🧾'
				/>

				<div className='bg-white border border-gray-200 rounded-xl p-5'>
					<div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
						<div>
							<h2 className='text-lg font-semibold text-gray-900'>
								{today.toLocaleString('en-IN', { month: 'long' })} {currentYear}
							</h2>
							<p className='text-sm text-gray-500 mt-1'>
								All employees under the current manager are shown below. Use the
								header checkbox to mark a full day for everyone, then uncheck
								individual employees who are absent.
							</p>
						</div>
						<div className='flex gap-3 flex-wrap'>
							<div className='rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm'>
								<span className='font-semibold text-emerald-700'>
									Present:
								</span>{' '}
								{totalPresentSelections}
							</div>
							<div className='rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm'>
								<span className='font-semibold text-red-700'>Absent:</span>{' '}
								{totalAbsentSelections}
							</div>
							<Button
								onClick={handleSubmit}
								disabled={loading || markMutation.isPending || !employees.length}
							>
								{markMutation.isPending ? 'Saving...' : 'Save Attendance'}
							</Button>
						</div>
					</div>
				</div>

				<div className='bg-white border border-gray-200 rounded-xl p-5 overflow-hidden'>
					{loading ? (
						<TableSkeleton rows={8} columns={10} />
					) : employees.length === 0 ? (
						<div className='text-sm text-gray-500 bg-gray-50 rounded-lg p-4'>
							No employees found for the current manager.
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='min-w-full border-separate border-spacing-0 text-sm'>
								<thead>
									<tr>
										<th className='sticky left-0 z-20 bg-white border-b border-gray-200 px-4 py-3 text-left min-w-[220px]'>
											Employee
										</th>
										{days.map(day => {
											const columnState = getColumnState(day);
											const weekend = columnState === 'weekend';
											return (
												<th
													key={day}
													className='border-b border-gray-200 px-2 py-3 text-center min-w-[64px]'
												>
													<div className='flex flex-col items-center gap-2'>
														<span className='text-xs font-medium text-gray-600'>
															{day}
														</span>
														<input
															type='checkbox'
															checked={columnState === 'present'}
															disabled={weekend}
															onChange={e => toggleColumn(day, e.target.checked)}
															className='h-4 w-4 accent-emerald-600 disabled:opacity-40'
														/>
													</div>
												</th>
											);
										})}
									</tr>
								</thead>
								<tbody>
									{employees.map((employee: any) => (
										<tr key={employee.id}>
											<td className='sticky left-0 z-10 bg-white border-b border-gray-100 px-4 py-3'>
												<div className='font-semibold text-gray-900'>
													{getEmployeeDisplayName(employee)}
												</div>
												<div className='text-xs text-gray-500'>
													{employee.employee_code || '--'}
												</div>
											</td>
											{days.map(day => {
												const state = getCellState(employee.id, day);
												return (
													<td
														key={`${employee.id}-${day}`}
														className='border-b border-gray-100 px-2 py-3 text-center'
													>
														<button
															type='button'
															onClick={() => toggleCell(employee.id, day)}
															disabled={state === 'weekend'}
															className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${getCellClasses(
																state
															)}`}
															title={
																state === 'weekend'
																	? 'Weekend'
																	: state === 'present'
																	? 'Present'
																	: 'Absent'
															}
														>
															{state === 'weekend' ? (
																<span className='text-[10px] font-semibold'>WE</span>
															) : (
																<input
																	type='checkbox'
																	readOnly
																	checked={state === 'present'}
																	className='h-4 w-4 accent-emerald-600 pointer-events-none'
																/>
															)}
														</button>
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
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

export default MarkAttendance;
