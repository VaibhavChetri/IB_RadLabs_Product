import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Button, FloatingDropdown, Snackbar, PageHeader } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import {
	useEmployeeManagerOptions,
	useMarkAttendance,
	useTeamAttendance,
} from '../../../features/hrm';
import { getEmployeeDisplayName } from '../../../features/hrm/utils/employeeDisplay';
import { RootState } from '../../../store';

type CellState = 'present' | 'absent' | 'optional' | 'unmarked';

const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();
const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const previousMonth = previousMonthDate.getMonth() + 1;
const previousMonthYear = previousMonthDate.getFullYear();

const getDaysInMonth = (month: number, year: number) =>
	new Date(year, month, 0).getDate();

const toIsoDate = (year: number, month: number, day: number) =>
	`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getWeekdayLabel = (year: number, month: number, day: number) =>
	new Date(year, month - 1, day).toLocaleDateString('en-IN', {
		weekday: 'short',
	});

const isSunday = (year: number, month: number, day: number) => {
	const value = new Date(year, month - 1, day).getDay();
	return value === 0;
};

const isTodayOrPast = (year: number, month: number, day: number) => {
	const candidate = new Date(year, month - 1, day);
	const boundary = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	return candidate.getTime() <= boundary.getTime();
};

const getCellClasses = (state: CellState) => {
	if (state === 'present') {
		return 'bg-emerald-50 border-emerald-200 text-emerald-700';
	}
	if (state === 'unmarked') {
		return 'bg-white border-gray-200 text-gray-400';
	}
	if (state === 'optional') {
		return 'bg-amber-50 border-amber-200 text-amber-700';
	}
	return 'bg-red-50 border-red-200 text-red-700';
};

export const MarkAttendance: React.FC = () => {
	const [attendanceGrid, setAttendanceGrid] = useState<Record<string, CellState>>({});
	const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous'>('current');
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({ open: false, message: '', type: 'success' });
	const user = useSelector((state: RootState) => state.auth.user);
	const queryClient = useQueryClient();
	const selectedMonth = selectedPeriod === 'current' ? currentMonth : previousMonth;
	const selectedYear = selectedPeriod === 'current' ? currentYear : previousMonthYear;
	const monthLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-IN', {
		month: 'long',
	});
	const periodOptions = [
		{ value: 'current', label: `${new Date(currentYear, currentMonth - 1, 1).toLocaleString('en-IN', { month: 'long' })} ${currentYear}` },
		{ value: 'previous', label: `${new Date(previousMonthYear, previousMonth - 1, 1).toLocaleString('en-IN', { month: 'long' })} ${previousMonthYear}` },
	];

	const { data: employeeData, isLoading: employeeLoading } = useEmployeeManagerOptions();
	const { data: existingAttendanceData, isLoading: attendanceLoading } = useTeamAttendance({
		month: selectedMonth,
		year: selectedYear,
		limit: 'all',
	});
	const markMutation = useMarkAttendance({ invalidateOnSuccess: false });

	const allEmployees = Array.isArray((employeeData as any)?.data)
		? (employeeData as any).data
		: [];
	const existingRows = Array.isArray((existingAttendanceData as any)?.data)
		? (existingAttendanceData as any).data
		: Array.isArray(existingAttendanceData)
		? existingAttendanceData
		: [];

	const currentEmployee = useMemo(() => {
		const userId = Number(user?.id);
		const userEmail = String(user?.email || '').trim().toLowerCase();
		return allEmployees.find((employee: any) => {
			if (Number.isFinite(userId) && Number(employee?.admin_id) === userId) {
				return true;
			}
			return String(employee?.email || '').trim().toLowerCase() === userEmail;
		});
	}, [allEmployees, user?.email, user?.id]);

	const employees = useMemo(() => {
		if (!currentEmployee?.id) return [];
		return allEmployees.filter(
			(employee: any) => Number(employee?.primary_manager_id) === Number(currentEmployee.id)
		);
	}, [allEmployees, currentEmployee?.id]);

	const filteredAttendanceRows = useMemo(() => {
		const allowedEmployeeIds = new Set(
			employees.map((employee: any) => Number(employee.id)).filter(Number.isFinite)
		);
		return existingRows.filter((row: any) =>
			allowedEmployeeIds.has(Number(row.employee_id))
		);
	}, [employees, existingRows]);

	const days = useMemo(
		() =>
			Array.from(
				{ length: getDaysInMonth(selectedMonth, selectedYear) },
				(_, index) => index + 1
			),
		[selectedMonth, selectedYear]
	);

	const activeDays = useMemo(
		() =>
			selectedPeriod === 'current'
				? days.filter(day => isTodayOrPast(selectedYear, selectedMonth, day))
				: days,
		[days, selectedMonth, selectedPeriod, selectedYear]
	);

	useEffect(() => {
		if (!employees.length) return;

		const nextGrid: Record<string, CellState> = {};

		employees.forEach((employee: any) => {
			days.forEach(day => {
				const dateKey = toIsoDate(selectedYear, selectedMonth, day);
				const key = `${employee.id}-${dateKey}`;
				nextGrid[key] = selectedPeriod === 'current' &&
					!isTodayOrPast(selectedYear, selectedMonth, day)
					? 'unmarked'
					: isSunday(selectedYear, selectedMonth, day)
					? 'optional'
					: 'unmarked';
			});
		});

		filteredAttendanceRows.forEach((row: any) => {
			(row.records || []).forEach((record: any) => {
				const key = `${row.employee_id}-${record.date}`;
				if (record.status === 'absent') {
					nextGrid[key] = 'absent';
				} else if (record.status === 'weekend') {
					nextGrid[key] = 'optional';
				} else if (record.status === 'holiday') {
					nextGrid[key] = 'optional';
				} else if (record.status) {
					nextGrid[key] = 'present';
				}
			});
		});

		setAttendanceGrid(nextGrid);
	}, [employees, filteredAttendanceRows, days, selectedMonth, selectedPeriod, selectedYear]);

	const getCellState = (employeeId: number, day: number): CellState => {
		const key = `${employeeId}-${toIsoDate(selectedYear, selectedMonth, day)}`;
		if (Object.prototype.hasOwnProperty.call(attendanceGrid, key)) {
			return attendanceGrid[key];
		}
		return selectedPeriod === 'current' && !isTodayOrPast(selectedYear, selectedMonth, day)
			? 'unmarked'
			: isSunday(selectedYear, selectedMonth, day)
			? 'optional'
			: 'unmarked';
	};

	const setCellState = (employeeId: number, day: number, value: CellState) => {
		const key = `${employeeId}-${toIsoDate(selectedYear, selectedMonth, day)}`;
		setAttendanceGrid(prev => ({ ...prev, [key]: value }));
	};

	const toggleCell = (employeeId: number, day: number) => {
		const current = getCellState(employeeId, day);
		if (selectedPeriod === 'current' && !isTodayOrPast(selectedYear, selectedMonth, day)) {
			setCellState(employeeId, day, current === 'present' ? 'unmarked' : 'present');
			return;
		}
		if (isSunday(selectedYear, selectedMonth, day)) {
			setCellState(employeeId, day, current === 'present' ? 'optional' : 'present');
			return;
		}
		if (current === 'unmarked') {
			setCellState(employeeId, day, 'present');
			return;
		}
		setCellState(employeeId, day, current === 'present' ? 'absent' : 'present');
	};

	const toggleColumn = (day: number, checked: boolean) => {
		setAttendanceGrid(prev => {
			const next = { ...prev };
			employees.forEach((employee: any) => {
				const key = `${employee.id}-${toIsoDate(selectedYear, selectedMonth, day)}`;
				next[key] = checked
					? 'present'
					: selectedPeriod === 'current' &&
					  !isTodayOrPast(selectedYear, selectedMonth, day)
					? 'unmarked'
					: isSunday(selectedYear, selectedMonth, day)
					? 'optional'
					: 'unmarked';
			});
			return next;
		});
	};

	const getColumnState = (day: number) => {
		const states = employees.map((employee: any) => getCellState(employee.id, day));

		if (!states.length) {
			return selectedPeriod === 'current' &&
				!isTodayOrPast(selectedYear, selectedMonth, day)
				? 'unmarked'
				: isSunday(selectedYear, selectedMonth, day)
				? 'optional'
				: 'unmarked';
		}
		return states.every((state: CellState) => state === 'present')
			? 'present'
			: states.every((state: CellState) => state === 'optional')
			? 'optional'
			: states.every((state: CellState) => state === 'unmarked')
			? 'unmarked'
			: 'absent';
	};

	const totalPresentSelections = useMemo(
		() =>
			employees.reduce((count: number, employee: any) => {
				return (
					count +
					activeDays.filter(day => getCellState(employee.id, day) === 'present').length
				);
			}, 0),
		[attendanceGrid, employees, activeDays]
	);

	const totalAbsentSelections = useMemo(
		() =>
			employees.reduce((count: number, employee: any) => {
				return (
					count +
					activeDays.filter(day => getCellState(employee.id, day) === 'absent').length
				);
			}, 0),
		[attendanceGrid, employees, activeDays]
	);

	const handleSubmit = async () => {
		if (!employees.length) return;

		try {
			for (const day of activeDays) {
				const date = toIsoDate(selectedYear, selectedMonth, day);
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

			await queryClient.invalidateQueries({ queryKey: ['hrm', 'attendance'] });

			setSnackbar({
				open: true,
				message: `Attendance saved for ${employees.length} employee(s) for ${monthLabel} ${selectedYear}.`,
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
								{monthLabel} {selectedYear}
							</h2>
							<p className='text-sm text-gray-500 mt-1'>
								Only direct reportees of the logged-in manager are shown below.
								Use the header checkbox to mark a full day for everyone, then
								uncheck individual employees who are absent.
							</p>
						</div>
						<div className='flex gap-3 flex-wrap'>
							<div className='w-full sm:w-[220px]'>
								<FloatingDropdown
									label='Attendance Month'
									options={periodOptions}
									value={selectedPeriod}
									onChange={value => setSelectedPeriod(value as 'current' | 'previous')}
									searchable={false}
								/>
							</div>
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
							<div className='rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm'>
								<span className='font-semibold text-gray-700'>Scope:</span>{' '}
								{selectedPeriod === 'current' ? 'Until today' : 'Full month'}
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
							{currentEmployee
								? 'No direct reportees found for the current manager.'
								: 'This login is not linked to a manager employee record yet.'}
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
									const sunday = isSunday(selectedYear, selectedMonth, day);
									const weekdayLabel = getWeekdayLabel(
										selectedYear,
										selectedMonth,
										day
									);
									return (
										<th
											key={day}
											className={`border-b border-gray-200 px-2 py-3 text-center min-w-[64px] ${
												sunday ? 'bg-amber-50/60' : ''
											}`}
										>
											<div className='flex flex-col items-center gap-2'>
												<span className='text-xs font-medium text-gray-600'>
													{day}
												</span>
												<span
													className={`text-[10px] font-semibold uppercase tracking-wide ${
														sunday ? 'text-amber-700' : 'text-gray-500'
													}`}
												>
													{weekdayLabel}
												</span>
												<input
													type='checkbox'
													checked={columnState === 'present'}
													onChange={e => toggleColumn(day, e.target.checked)}
													className='h-4 w-4 accent-emerald-600'
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
												const sunday = isSunday(selectedYear, selectedMonth, day);
												return (
													<td
														key={`${employee.id}-${day}`}
														className={`border-b border-gray-100 px-2 py-3 text-center ${
															sunday ? 'bg-amber-50/40' : ''
														}`}
													>
														<button
															type='button'
															onClick={() => toggleCell(employee.id, day)}
															className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${getCellClasses(
																state
															)}`}
															title={`${sunday ? 'Sunday - ' : ''}${
																state === 'present'
																	? 'Present'
																	: state === 'unmarked'
																	? 'Not marked'
																	: state === 'optional'
																	? 'Optional'
																	: 'Absent'
															}`}
														>
															<input
																type='checkbox'
																readOnly
																checked={state === 'present'}
																className='h-4 w-4 accent-emerald-600 pointer-events-none'
															/>
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
