import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PageHeader, Snackbar, FloatingInput, SearchButton } from '../../../components/ui';
import { TableSkeleton } from '../../../components/ui/Skeleton';
import { ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { ShiftApiService, ShiftDetail } from '../../../services/shiftApi';
import { RootState } from '../../../store';

export const ShiftReportingListing: React.FC = () => {
	const { user } = useSelector((state: RootState) => state.auth);
	const [shiftDate, setShiftDate] = useState<string>('');
	const [shifts, setShifts] = useState<ShiftDetail[]>([]);
	const [loading, setLoading] = useState(false);
	const [openAccordion, setOpenAccordion] = useState<number | null>(null);
	const [activeTab, setActiveTab] = useState<Record<number, 'checkin' | 'checkout'>>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Set default date to today
	useEffect(() => {
		const today = new Date();
		const formattedDate = today.toISOString().split('T')[0];
		setShiftDate(formattedDate);
	}, []);

	// Fetch shift data
	const fetchShiftData = async () => {
		if (!shiftDate || !user?.city_id) {
			setSnackbar({
				open: true,
				message: 'Please select a date and ensure city is available',
				type: 'error',
			});
			return;
		}

		setLoading(true);
		try {
			const response = await ShiftApiService.getFullShiftDetails({
				city_id: user.city_id,
				shift_date: shiftDate,
			});

			if (response.status_code === 200 && response.data) {
				setShifts(response.data);
				// Set default tab to 'checkin' for all shifts
				const defaultTabs: Record<number, 'checkin' | 'checkout'> = {};
				response.data.forEach(shift => {
					defaultTabs[shift.shiftId] = 'checkin';
				});
				setActiveTab(defaultTabs);
			} else {
				setShifts([]);
			}
		} catch (error) {
			console.error('Error fetching shift data:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load shift data',
				type: 'error',
			});
			setShifts([]);
		} finally {
			setLoading(false);
		}
	};

	// Auto-fetch on date change
	useEffect(() => {
		if (shiftDate && user?.city_id) {
			fetchShiftData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shiftDate, user?.city_id]);

	const formatDateTime = (dateTime: string | null) => {
		if (!dateTime) return 'Pending';
		return new Date(dateTime).toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	};

	// Get status background and text color for check-in table
	const getStatusStyle = (status: string) => {
		const statusLower = status.toLowerCase();
		// Shortage and Non-Functional: red
		if (statusLower === 'shortage' || statusLower === 'non-functional') {
			return {
				bg: 'bg-red-50',
				text: 'text-red-600',
			};
		}
		// Functional and Available: green
		if (statusLower === 'functional' || statusLower === 'available') {
			return {
				bg: 'bg-green-50',
				text: 'text-green-600',
			};
		}
		// Default
		return {
			bg: 'bg-gray-50',
			text: 'text-gray-600',
		};
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-6'>
					<PageHeader
						title='Shift Reporting'
						totalItems={shifts.length}
						itemType='shifts'
						icon='📋'
					/>
				</div>

				{/* Filter Section */}
				<div className='mb-6 flex w-full'>
					<div className='relative bg-white border border-gray-200 rounded-xl p-5 flex w-full gap-3 items-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.8)]'>
						<div className='w-56 relative z-10'>
							<FloatingInput
								label='Shift Date'
								type='date'
								value={shiftDate}
								onChange={setShiftDate}
							/>
						</div>
						<div className='relative z-10'>
							<SearchButton
								onClick={fetchShiftData}
								disabled={loading || !shiftDate || !user?.city_id}
							/>
						</div>
					</div>
				</div>

				{loading ? (
					<TableSkeleton rows={5} columns={8} />
				) : shifts.length > 0 ? (
					<div className='bg-white rounded-lg overflow-hidden'>
						{/* Table Header */}
						<div className='py-3 border-b border-gray-200 bg-gray-50'>
							<div className='grid grid-cols-8  gap-4 text-sm font-semibold text-gray-700'>
								<div className='col-span-1 text-center'>#</div>
								<div className='col-span-1 text-center'>City</div>
								<div className='col-span-2 text-center'>Facility</div>
								<div className='col-span-1 text-center'>Time</div>
								<div className='col-span-1 text-center'>Supervisor</div>
								<div className='col-span-1 text-center'>Check-In</div>
								<div className='col-span-1 text-center'>Check-Out</div>
							</div>
						</div>

						{/* Accordion Rows */}
						<div>
							{shifts.map((shift, index) => (
								<div
									key={shift.shiftId}
									className={`group transition-colors border-b border-gray-200 ${
										openAccordion === shift.shiftId
											? 'border-l-4 border-l-green-500 bg-gray-50'
											: 'hover:bg-gray-50'
									}`}
								>
									{/* Row Header */}
									<div
										className='py-3 cursor-pointer'
										onClick={() => {
											setOpenAccordion(openAccordion === shift.shiftId ? null : shift.shiftId);
										}}
									>
										<div className='grid grid-cols-8 gap-4 items-center'>
											<div className='col-span-1 text-center'>
												<span className='text-sm font-medium text-gray-900'>{index + 1}</span>
											</div>
											<div className='col-span-1 text-center'>
												<span className='text-sm text-gray-900'>{shift.city}</span>
											</div>
											<div className='col-span-2 text-center'>
												<span className='text-sm text-gray-900'>{shift.facility}</span>
											</div>
											<div className='col-span-1 text-center'>
												{shift.shiftTime?.toLowerCase().includes('day') ||
												shift.shiftTime?.toLowerCase().includes('morning') ||
												shift.shiftTime?.toLowerCase().includes('am') ? (
													<div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50%] bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 min-w-[100px] justify-center'>
														<span className='text-sm font-medium text-gray-800 whitespace-nowrap'>
															{shift.shiftTime}
														</span>
														<Sun className='w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0' />
													</div>
												) : shift.shiftTime?.toLowerCase().includes('night') ||
												  shift.shiftTime?.toLowerCase().includes('evening') ||
												  shift.shiftTime?.toLowerCase().includes('pm') ? (
													<div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[50%] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 min-w-[100px] justify-center'>
														<span className='text-sm font-medium text-gray-800 whitespace-nowrap'>
															{shift.shiftTime}
														</span>
														<Moon className='w-5 h-5 text-indigo-600 fill-indigo-600 flex-shrink-0' />
													</div>
												) : (
													<span className='text-sm text-gray-900'>{shift.shiftTime}</span>
												)}
											</div>
											<div className='col-span-1 text-center'>
												<span className='text-sm text-gray-900'>{shift.supervisor}</span>
											</div>
											<div className='col-span-1 text-center'>
												<span className='text-sm text-green-600'>
													{formatDateTime(shift.checkInTime)}
												</span>
											</div>
											<div className='col-span-1 flex gap-1 items-center justify-center'>
												<span
													className={`text-sm ${
														shift.checkOutTime ? 'text-blue-600' : 'text-orange-600'
													}`}
												>
													{formatDateTime(shift.checkOutTime)}
												</span>
												{openAccordion === shift.shiftId ? (
													<ChevronUp
														className='w-5 h-5 text-gray-400 flex-shrink-0'
														strokeWidth={2}
													/>
												) : (
													<ChevronDown
														className='w-5 h-5 text-gray-400 flex-shrink-0'
														strokeWidth={2}
													/>
												)}
											</div>
										</div>
									</div>

									{/* Accordion Content */}
									<div
										className={`overflow-hidden transition-all duration-300 ease-in-out ${
											openAccordion === shift.shiftId
												? 'max-h-screen opacity-100'
												: 'max-h-0 opacity-0'
										}`}
									>
										<div className='px-6 pb-4'>
											{/* Tabs */}
											<div className='flex border-b border-gray-200 mb-4'>
												<button
													onClick={e => {
														e.stopPropagation();
														setActiveTab(prev => ({ ...prev, [shift.shiftId]: 'checkin' }));
													}}
													className={`px-4 py-2 text-sm font-medium transition-colors ${
														activeTab[shift.shiftId] === 'checkin'
															? 'text-green-600 border-b-2 border-green-600'
															: 'text-gray-600 hover:text-gray-900'
													}`}
												>
													Check-In
												</button>
												<button
													onClick={e => {
														e.stopPropagation();
														setActiveTab(prev => ({ ...prev, [shift.shiftId]: 'checkout' }));
													}}
													className={`px-4 py-2 text-sm font-medium transition-colors ${
														activeTab[shift.shiftId] === 'checkout'
															? 'text-green-600 border-b-2 border-green-600'
															: 'text-gray-600 hover:text-gray-900'
													}`}
												>
													Check-Out
												</button>
											</div>

											{/* Tab Content */}
											{activeTab[shift.shiftId] === 'checkin' ? (
												<div className='space-y-4'>
													{/* Resources Info Table */}
													<div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
														{/* Table Headers */}
														<div className='px-4 py-3 bg-gray-50 border-b border-gray-200'>
															<div className='grid grid-cols-4 gap-4 text-sm font-semibold text-gray-700'>
																<div className='col-span-1 text-center'>Number</div>
																<div className='col-span-1 text-center'>Resource Name</div>
																<div className='col-span-1 text-center'>Ops Status</div>
																<div className='col-span-1 text-center'>Escalated To</div>
															</div>
														</div>
														<div className='divide-y divide-gray-100'>
															{shift.resourcesInfo.map((resource, idx) => {
																const statusStyle = getStatusStyle(resource.resourceStatus);
																return (
																	<div
																		key={resource.shiftResourceId}
																		className='px-4 py-3 grid grid-cols-4 gap-4 text-sm hover:bg-gray-50 transition-colors'
																	>
																		<div className='col-span-1 font-medium text-gray-900 text-center'>
																			{idx + 1}
																		</div>
																		<div className='col-span-1 text-gray-900 text-center'>
																			{resource.shiftResourceName}
																		</div>
																		<div
																			className={`col-span-1 text-center ${statusStyle.bg} py-2 rounded`}
																		>
																			<span className={statusStyle.text}>
																				{resource.resourceStatus}
																			</span>
																		</div>
																		<div className='col-span-1 text-gray-600 text-center'>
																			{resource.escalationManager || '-'}
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												</div>
											) : (
												<div className='space-y-4'>
													{/* Check-Out Details */}
													{shift.checkout && shift.checkout.manpowerCount !== null ? (
														<div className='bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm'>
															<div className='px-4 py-3 border-b-2 border-green-500 bg-gradient-to-r from-green-50 to-green-100/50'>
																<h3 className='text-sm font-bold text-green-800 uppercase tracking-wide'>
																	Check-Out Details & Containers
																</h3>
															</div>
															{/* Simple Table with 6 Columns */}
															<div className='overflow-x-auto'>
																<table className='w-full'>
																	<thead>
																		<tr className='bg-gradient-to-r from-green-50 to-green-100/30 border-b-2 border-blue-200'>
																			<th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
																				Manpower
																			</th>
																			<th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
																				Man Hours
																			</th>
																			<th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
																				Shift Hours
																			</th>
																			<th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
																				OT Hours
																			</th>
																			<th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
																				Washed SKU
																			</th>
																			<th className='px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider'>
																				Efficiency
																			</th>
																		</tr>
																	</thead>
																	<tbody>
																		<tr className='hover:bg-gray-50 transition-colors'>
																			<td className='px-4 py-3 text-sm font-semibold text-gray-900 text-center'>
																				{shift.checkout.manpowerCount}
																			</td>
																			<td className='px-4 py-3 text-sm font-semibold text-gray-900 text-center'>
																				{shift.checkout.manHours}
																			</td>
																			<td className='px-4 py-3 text-sm font-semibold text-gray-900 text-center'>
																				{shift.checkout.shiftHours}
																			</td>
																			<td className='px-4 py-3 text-sm font-semibold text-gray-900 text-center'>
																				{shift.checkout.OTHours}
																			</td>
																			<td className='px-4 py-3 text-sm font-semibold text-gray-900 text-center'>
																				{shift.checkout.washedSkuCount?.toLocaleString()}
																			</td>
																			<td className='px-4 py-3 text-sm font-semibold text-gray-900 text-center'>
																				{shift.checkout.washingEfficiency?.toFixed(2)} opd/man hour
																			</td>
																		</tr>
																	</tbody>
																</table>
															</div>
														</div>
													) : (
														<div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
															<p className='text-sm text-gray-600'>
																Check-out details not available
															</p>
														</div>
													)}

													{/* Containers Info Table */}
													{shift.containersInfo.length > 0 ? (
														<div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
															<div className='px-4 py-3 border-b-2 border-green-500 bg-gradient-to-r from-green-50 to-green-100/50'>
																<h3 className='text-sm font-bold text-green-800 uppercase tracking-wide'>
																	Containers Info
																</h3>
															</div>
															<div className='divide-y divide-gray-100 max-h-96 overflow-y-auto'>
																{shift.containersInfo.map((container, idx) => (
																	<div
																		key={container.container_type_id}
																		className='px-4 py-3 grid grid-cols-3 gap-4 text-sm hover:bg-gray-50 transition-colors'
																	>
																		<div className='col-span-1 font-medium text-gray-900'>
																			{idx + 1}
																		</div>
																		<div className='col-span-1 text-gray-900'>{container.sku}</div>
																		<div className='col-span-1 text-gray-900 font-medium'>
																			{container.count.toLocaleString()}
																		</div>
																	</div>
																))}
															</div>
														</div>
													) : (
														<div className='bg-gray-50 border border-gray-200 rounded-lg p-4 text-center'>
															<p className='text-sm text-gray-600'>
																No containers information available
															</p>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
						<div className='text-gray-400 mb-4'>
							<svg
								className='w-12 h-12 mx-auto'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
								/>
							</svg>
						</div>
						<h3 className='text-lg font-medium text-gray-900 mb-2'>No Shifts Found</h3>
						<p className='text-gray-600'>
							No shifts were found for the selected date. Please try a different date.
						</p>
					</div>
				)}

				<Snackbar
					message={snackbar.message}
					type={snackbar.type}
					open={snackbar.open}
					onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
				/>
			</div>
		</div>
	);
};
