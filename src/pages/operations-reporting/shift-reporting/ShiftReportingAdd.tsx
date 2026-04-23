import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
	PageHeader,
	Snackbar,
	FloatingInput,
	FloatingDropdown,
	Dropdown,
	Button,
} from '../../../components/ui';
import {
	ShiftApiService,
	Hora,
	ShiftStatus,
	OpsStatus,
	EscalationManager,
	CheckInShiftOpsStatusRequest,
	CheckOutShiftOpsStatusRequest,
	CheckOutContainerInfo,
} from '../../../services/shiftApi';
import { ContainerApiService, ContainerType } from '../../../services/containerApi';
import { RootState } from '../../../store';

interface ResourceRow {
	resourceId: number;
	resourceName: string;
	opsStatusId: number | null;
	escalationManagerId: number | null;
}

export const ShiftReportingAdd: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useSelector((state: RootState) => state.auth);
	// Set default date to today in YYYY-MM-DD format
	const getTodayDate = () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};
	const [shiftDate, setShiftDate] = useState<string>(getTodayDate());
	const [selectedHoraId, setSelectedHoraId] = useState<number | null>(null);
	const [horaOptions, setHoraOptions] = useState<Hora[]>([]);
	const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
	const [opsStatusOptions, setOpsStatusOptions] = useState<OpsStatus[]>([]);
	const [escalationManagers, setEscalationManagers] = useState<EscalationManager[]>([]);
	const [resourceRows, setResourceRows] = useState<ResourceRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [apiError, setApiError] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		type: 'success' | 'error';
	}>({
		open: false,
		message: '',
		type: 'success',
	});

	// Checkout-specific state
	const [manpowerCount, setManpowerCount] = useState<number>(0);
	const [shiftHours, setShiftHours] = useState<number>(0);
	const [otHours, setOtHours] = useState<number>(0);
	const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
	const [containerCounts, setContainerCounts] = useState<Record<number, number>>({});

	// Load Hora options on mount
	useEffect(() => {
		const loadHoraOptions = async () => {
			try {
				const response = await ShiftApiService.getHora();
				if (response.status === 'Success' && response.result) {
					setHoraOptions(response.result);
				}
			} catch (error) {
				console.error('Failed to load Hora options:', error);
				setSnackbar({
					open: true,
					message: 'Failed to load time options',
					type: 'error',
				});
			}
		};
		loadHoraOptions();
	}, []);

	// Load resources, ops status, and escalation managers on mount
	useEffect(() => {
		const loadInitialData = async () => {
			// Don't load if user city_id is not available
			if (!user?.city_id) {
				setApiError('City information not available. Please contact administrator.');
				return;
			}

			try {
				setApiError(null);
				const [resourcesRes, opsStatusRes, escalationRes] = await Promise.all([
					ShiftApiService.getFacilityResources(1, 100, user.city_id),
					ShiftApiService.getOpsStatusValues(),
					ShiftApiService.getEscalationManagers(),
				]);

				if (resourcesRes.status === 'Success' && resourcesRes.data) {
					// Initialize resource rows
					const initialRows: ResourceRow[] = resourcesRes.data.map(resource => ({
						resourceId: resource.id,
						resourceName: resource.name,
						opsStatusId: null,
						escalationManagerId: null,
					}));
					setResourceRows(initialRows);

					// Log for debugging
					console.log(
						'📋 Loaded resources:',
						initialRows.length,
						'for user:',
						user?.name,
						'city_id:',
						user?.city_id
					);

					if (initialRows.length === 0) {
						setApiError(
							`No resources available for ${user?.city_name || 'your city'}. Please contact administrator to set up resources.`
						);
					}
				} else {
					console.warn('⚠️ Resources response:', resourcesRes);
					setApiError(
						`Failed to load resources for ${user?.city_name || 'your city'}. Please try again or contact administrator.`
					);
				}

				if (opsStatusRes.status === 'Success' && opsStatusRes.data) {
					setOpsStatusOptions(opsStatusRes.data);
				} else {
					console.warn('⚠️ Ops status response:', opsStatusRes);
				}

				if (escalationRes.status === 'Success' && escalationRes.data) {
					setEscalationManagers(escalationRes.data);
				} else {
					console.warn('⚠️ Escalation managers response:', escalationRes);
				}
			} catch (error) {
				console.error('❌ Failed to load initial data:', error);
				setApiError('Failed to load data. Please refresh the page or contact administrator.');
				setSnackbar({
					open: true,
					message: 'Failed to load resources',
					type: 'error',
				});
			}
		};
		loadInitialData();
	}, [user?.city_id, user?.name, user?.city_name]);

	// Check shift status when hora (time) is selected
	useEffect(() => {
		const checkShiftStatus = async () => {
			if (!selectedHoraId || !shiftDate) {
				setShiftStatus(null);
				return;
			}

			setLoading(true);
			setApiError(null);
			try {
				console.log('🔍 Calling getShiftStatusByDate with:', {
					shift_date: shiftDate,
					hora_id: selectedHoraId,
					user: user?.name,
				});
				const response = await ShiftApiService.getShiftStatusByDate(shiftDate, selectedHoraId);
				console.log('📊 Shift status response:', response);

				if (response.status === 'Success' && response.shifts) {
					if (response.shifts.length > 0) {
						setShiftStatus(response.shifts[0]);
						console.log('✅ Shift status found:', response.shifts[0]);
					} else {
						setShiftStatus(null);
						console.log('ℹ️ No shift status found - new shift');
					}
				} else {
					console.warn('⚠️ Unexpected response format:', response);
					setShiftStatus(null);
				}
			} catch (error) {
				console.error('❌ Failed to check shift status:', error);
				setShiftStatus(null); // Set to null so table can still show
				setApiError('Failed to check shift status. You can still proceed with data entry.');
				setSnackbar({
					open: true,
					message: 'Failed to check shift status. You can still proceed.',
					type: 'error',
				});
			} finally {
				setLoading(false);
			}
		};

		checkShiftStatus();
	}, [selectedHoraId, shiftDate, user?.name]);

	// Load container types when in checkout mode
	useEffect(() => {
		const loadContainers = async () => {
			// Only load if we're in checkout mode (check-in done, checkout pending)
			if (shiftStatus && shiftStatus.check_out === null) {
				try {
					const response = await ContainerApiService.getDistinctContainerNamesBasedOnCity();
					if (response.status === 'Success' && response.data?.data) {
						// Sort containers alphabetically by container_name
						const sortedContainers = [...response.data.data].sort((a, b) => {
							const nameA = a.container_name || a.container || a.sku || '';
							const nameB = b.container_name || b.container || b.sku || '';
							return nameA.localeCompare(nameB);
						});

						setContainerTypes(sortedContainers);
						// Initialize container counts to 0
						const initialCounts: Record<number, number> = {};
						sortedContainers.forEach(container => {
							const containerId = container.container_type_id || container.id || 0;
							initialCounts[containerId] = 0;
						});
						setContainerCounts(initialCounts);
					}
				} catch (error) {
					console.error('Failed to load container types:', error);
				}
			}
		};
		loadContainers();
	}, [shiftStatus]);

	// Handle time dropdown change - explicitly call API
	const handleTimeChange = (value: string) => {
		const horaId = value ? Number(value) : null;
		setSelectedHoraId(horaId);
		// API will be called via useEffect when horaId changes
	};

	// Convert hora options to dropdown format
	const horaDropdownOptions = useMemo(() => {
		return horaOptions.map(hora => ({
			value: String(hora.id),
			label: hora.name,
		}));
	}, [horaOptions]);

	// Convert ops status to dropdown format
	const opsStatusDropdownOptions = useMemo(() => {
		return opsStatusOptions.map(status => ({
			value: String(status.id),
			label: status.name,
		}));
	}, [opsStatusOptions]);

	// Convert escalation managers to dropdown format
	const escalationDropdownOptions = useMemo(() => {
		return escalationManagers.map(manager => ({
			value: String(manager.id),
			label: manager.name,
		}));
	}, [escalationManagers]);

	// Handle resource ops status change
	const handleOpsStatusChange = (resourceId: number, opsStatusId: number | null) => {
		setResourceRows(prevRows =>
			prevRows.map(row => {
				if (row.resourceId === resourceId) {
					const opsStatus = opsStatusOptions.find(s => s.id === opsStatusId);
					const shouldShowEscalation =
						opsStatus?.name === 'Non-Functional' || opsStatus?.name === 'Shortage';
					return {
						...row,
						opsStatusId,
						escalationManagerId: shouldShowEscalation ? row.escalationManagerId : null,
					};
				}
				return row;
			})
		);
	};

	// Handle escalation manager change
	const handleEscalationChange = (resourceId: number, escalationManagerId: number | null) => {
		setResourceRows(prevRows =>
			prevRows.map(row => (row.resourceId === resourceId ? { ...row, escalationManagerId } : row))
		);
	};

	// Determine if table should be shown - only when time is selected and shift is not fully completed
	const shouldShowTable = useMemo(() => {
		// Don't show table if time is not selected
		if (!selectedHoraId) return false;

		// If both check-in and check-out are done, don't show the editable table
		if (shiftStatus && shiftStatus.check_out !== null && shiftStatus.status === 'Completed') {
			return false;
		}

		// Show table if:
		// 1. Check-in is not done (shiftStatus is null)
		// 2. Check-in is done but check-out is pending (check_out is null)
		return true;
	}, [selectedHoraId, shiftStatus]);

	// Get table header text based on what's not done
	const getTableHeader = useMemo(() => {
		if (!selectedHoraId) return 'Resource Status';

		// If shift status is null, check-in is not done
		if (!shiftStatus) return 'Check-in';

		// If check-out is null, check-out is not done
		if (shiftStatus.check_out === null) return 'Check-out';

		return 'Resource Status';
	}, [shiftStatus, selectedHoraId]);

	// Get status message
	const getStatusMessage = () => {
		if (!shiftStatus) {
			return null;
		}
		if (shiftStatus.check_out === null) {
			return {
				type: 'info' as const,
				message: 'Check-in already done. Please proceed with check-out details.',
			};
		}
		if (shiftStatus.status === 'Completed') {
			return {
				type: 'success' as const,
				message: 'Check-in and check-out both are done.',
			};
		}
		return null;
	};

	const statusMessage = getStatusMessage();

	// Handle submit
	const handleSubmit = async () => {
		// Validate required fields
		if (!selectedHoraId || !shiftDate) {
			setSnackbar({
				open: true,
				message: 'Please select date and time',
				type: 'error',
			});
			return;
		}

		// Determine if we're in checkout mode
		const isCheckout = shiftStatus !== null && shiftStatus.check_out === null;

		setLoading(true);
		try {
			if (isCheckout) {
				// Checkout mode - call checkOutShiftOpsStatus
				// Validate checkout fields
				if (manpowerCount <= 0 || shiftHours <= 0) {
					setSnackbar({
						open: true,
						message: 'Please enter valid manpower count and shift hours',
						type: 'error',
					});
					setLoading(false);
					return;
				}

				// Build containers info from containerCounts
				const containersInfo: CheckOutContainerInfo[] = Object.entries(containerCounts)
					.map(([container_type_id, count]) => ({
						container_type_id: Number(container_type_id),
						count: count || 0,
					}));

				const checkoutPayload: CheckOutShiftOpsStatusRequest = {
					hora_id: selectedHoraId,
					shift_date: shiftDate,
					shift_id: shiftStatus.shift_id,
					manpower_count: manpowerCount,
					shift_hours: shiftHours,
					ot_hours: otHours,
					containersInfo,
				};

				const response = await ShiftApiService.checkOutShiftOpsStatus(checkoutPayload);

				if (response.status === 'Success') {
					setSnackbar({
						open: true,
						message: response.message || 'Shift checkout recorded successfully',
						type: 'success',
					});

					setTimeout(() => {
						navigate('/operations-reporting/shift-reporting/listing');
					}, 1500);
				} else {
					setSnackbar({
						open: true,
						message: response.message || 'Failed to submit checkout data',
						type: 'error',
					});
				}
			} else {
				// Check-in mode - call checkInShiftOpsStatus
				// Check if at least one resource has ops status selected
				const hasOpsStatus = resourceRows.some(row => row.opsStatusId !== null);
				if (!hasOpsStatus) {
					setSnackbar({
						open: true,
						message: 'Please select ops status for at least one resource',
						type: 'error',
					});
					setLoading(false);
					return;
				}

				// Build resourcesInfo array
				const resourcesInfo = resourceRows
					.filter(row => row.opsStatusId !== null)
					.map(row => {
						const resourceInfo: CheckInShiftOpsStatusRequest['resourcesInfo'][0] = {
							shift_resource_id: row.resourceId,
							resource_status_id: row.opsStatusId!,
						};

						// Add escalation manager ID if selected and ops status requires it
						if (row.escalationManagerId !== null) {
							const opsStatus = opsStatusOptions.find(s => s.id === row.opsStatusId);
							const shouldIncludeEscalation =
								opsStatus?.name === 'Non-Functional' || opsStatus?.name === 'Shortage';
							if (shouldIncludeEscalation) {
								resourceInfo.shift_escalation_manager_id = row.escalationManagerId;
							}
						}

						return resourceInfo;
					});

				const checkinPayload: CheckInShiftOpsStatusRequest = {
					hora_id: selectedHoraId,
					shift_date: shiftDate,
					resourcesInfo,
				};

				const response = await ShiftApiService.checkInShiftOpsStatus(checkinPayload);

				if (response.status === 'Success') {
					setSnackbar({
						open: true,
						message: response.message || 'Shift and resources inserted successfully',
						type: 'success',
					});

					setTimeout(() => {
						navigate('/operations-reporting/shift-reporting/listing');
					}, 1500);
				} else {
					setSnackbar({
						open: true,
						message: response.message || 'Failed to submit shift data',
						type: 'error',
					});
				}
			}
		} catch (error) {
			console.error('Failed to submit shift data:', error);
			setSnackbar({
				open: true,
				message: 'Failed to submit shift data. Please try again.',
				type: 'error',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-white p-4'>
			<div className='max-w-7xl mx-auto'>
				<PageHeader title='Add Shift Reporting' totalItems={0} itemType='shift reports' icon='📋' />

				{/* Filter Section */}
				<div className='mt-6 bg-white border border-gray-200 rounded-lg p-6'>
					<div className='flex gap-4 items-end'>
						<div className='w-56'>
							<FloatingInput
								label='Shift Date'
								type='date'
								value={shiftDate}
								onChange={setShiftDate}
								required
							/>
						</div>
						<div className='w-56'>
							<FloatingDropdown
								label='Time'
								options={horaDropdownOptions}
								value={selectedHoraId ? String(selectedHoraId) : ''}
								onChange={handleTimeChange}
								placeholder='Select time'
								required
								loading={loading}
							/>
						</div>
					</div>
				</div>

				{/* Error Message */}
				{apiError && (
					<div className='mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800'>
						<p className='font-medium'>{apiError}</p>
					</div>
				)}

				{/* Status Message */}
				{statusMessage && (
					<div
						className={`mt-4 p-4 rounded-lg ${
							statusMessage.type === 'info'
								? 'bg-blue-50 border border-blue-200 text-blue-800'
								: 'bg-green-50 border border-green-200 text-green-800'
						}`}
					>
						<p className='font-medium'>{statusMessage.message}</p>
						{shiftStatus && shiftStatus.check_out === null && (
							<div className='mt-2 text-sm'>
								<p>
									<strong>Check-in:</strong> {shiftStatus.check_in || 'N/A'}
								</p>
								<p>
									<strong>Status:</strong> {shiftStatus.status}
								</p>
							</div>
						)}
					</div>
				)}


			{/* Checkout Form - shown when in checkout mode */}
			{shiftStatus && shiftStatus.check_out === null && (
				<div className='mt-6'>
					<h3 className='text-lg font-semibold text-gray-900 mb-4'>Checkout Details</h3>
					<div className='bg-white border border-gray-200 rounded-lg p-6'>
						{/* Manpower and Hours Section */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
							<div>
								<FloatingInput
									label='Manpower Count'
									type='number'
									value={String(manpowerCount)}
									onChange={value => setManpowerCount(Number(value) || 0)}
									required
								/>
							</div>
							<div>
								<FloatingInput
									label='Shift Hours'
									type='number'
									value={String(shiftHours)}
									onChange={value => setShiftHours(Number(value) || 0)}
									required
								/>
							</div>
							<div>
								<FloatingInput
									label='OT Hours'
									type='number'
									value={String(otHours)}
									onChange={value => setOtHours(Number(value) || 0)}
								/>
							</div>
						</div>

						{/* Container Counts Section */}
						{containerTypes.length > 0 && (
							<div className='border-t border-gray-200 pt-6'>
								<h4 className='text-md font-semibold text-gray-900 mb-4'>Container Counts</h4>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							{containerTypes.map(container => {
								const containerId = container.container_type_id || container.id || 0;
								const containerName = container.container_name || container.sku || container.container || `Container ${containerId}`;
								return (
									<div key={containerId}>
										<FloatingInput
											label={containerName}
											type='number'
											value={String(containerCounts[containerId] || 0)}
											onChange={value =>
												setContainerCounts(prev => ({
													...prev,
													[containerId]: Number(value) || 0,
												}))
											}
										/>
									</div>
								);
							})}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

				{/* Resources Table */}
				{shouldShowTable && !(shiftStatus && shiftStatus.check_out === null) && (
					<div className='mt-6'>
						{/* Separate heading */}
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>{getTableHeader}</h3>

						{resourceRows.length === 0 ? (
							<div className='bg-white border border-gray-200 rounded-lg p-8 text-center'>
								<p className='text-gray-500'>
									No resources available. Please contact your administrator to set up resources for
									your account.
								</p>
								{user?.name && <p className='text-sm text-gray-400 mt-2'>User: {user.name}</p>}
							</div>
						) : (
							<div className='bg-white border border-gray-200 rounded-lg overflow-hidden'>
								<div className='overflow-x-auto'>
									<table className='w-full'>
										<thead className='bg-gray-50 border-b border-gray-200'>
											<tr>
												<th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
													Resource
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
													Ops Status
												</th>
												<th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>
													Escalated To
												</th>
											</tr>
										</thead>
										<tbody className='bg-white divide-y divide-gray-200'>
											{resourceRows.map(row => {
												const opsStatus = opsStatusOptions.find(s => s.id === row.opsStatusId);
												const shouldShowEscalation =
													opsStatus?.name === 'Non-Functional' || opsStatus?.name === 'Shortage';

												// Color code based on status type: Shortage/Non-Functional = red, Functional/Available = green
												const getStatusBgColor = () => {
													if (!opsStatus) return '';
													const statusName = opsStatus.name.toLowerCase();
													if (statusName === 'shortage' || statusName === 'non-functional') {
														return 'bg-red-50';
													}
													if (statusName === 'functional' || statusName === 'available') {
														return 'bg-green-50';
													}
													return '';
												};

												return (
													<tr key={row.resourceId} className='hover:bg-gray-50'>
														<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
															{row.resourceName}
														</td>
														<td className={`px-6 py-4 whitespace-nowrap ${getStatusBgColor()}`}>
															<div className='w-48'>
																<Dropdown
																	options={opsStatusDropdownOptions}
																	value={row.opsStatusId ? String(row.opsStatusId) : ''}
																	onChange={value =>
																		handleOpsStatusChange(
																			row.resourceId,
																			value ? Number(value) : null
																		)
																	}
																	placeholder='Select status'
																	searchable={false}
																/>
															</div>
														</td>
														<td className='px-6 py-4 whitespace-nowrap'>
															{shouldShowEscalation ? (
																<div className='w-48'>
																	<Dropdown
																		options={escalationDropdownOptions}
																		value={
																			row.escalationManagerId ? String(row.escalationManagerId) : ''
																		}
																		onChange={value =>
																			handleEscalationChange(
																				row.resourceId,
																				value ? Number(value) : null
																			)
																		}
																		placeholder='Select manager'
																		searchable={false}
																	/>
																</div>
															) : (
																<span className='text-sm text-gray-400'>-</span>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Submit Button */}
				{(shouldShowTable || (shiftStatus && shiftStatus.check_out === null)) && (
					<div className='mt-6 flex justify-end'>
						<Button
							onClick={handleSubmit}
							variant='primary'
							size='lg'
							loading={loading}
							disabled={loading}
						>
							{shiftStatus && shiftStatus.check_out === null ? 'Submit Checkout' : 'Submit'}
						</Button>
					</div>
				)}

				<Snackbar
					open={snackbar.open}
					message={snackbar.message}
					type={snackbar.type}
					onClose={() => setSnackbar({ ...snackbar, open: false })}
				/>
			</div>
		</div>
	);
};
